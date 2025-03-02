import logging
import os
import asyncio
import aiohttp
from dotenv import load_dotenv
from livekit.agents import (
    AutoSubscribe,
    JobContext,
    JobProcess,
    WorkerOptions,
    cli,
    llm,
    metrics,
)
from livekit.agents.pipeline import VoicePipelineAgent
from livekit.plugins import cartesia, openai, deepgram, silero, google, turn_detector
from typing import Annotated

from realtime import AsyncRealtimeClient, RealtimeSubscribeStates

load_dotenv(dotenv_path=".env.local")
logger = logging.getLogger("voice-agent")

async def publish_realtime_log(message: str):
    realtime_url = os.getenv("SUPABASE_REALTIME_URL")
    anon_key = os.getenv("SUPABASE_ANON_KEY")
    if not realtime_url or not anon_key:
        logger.error("SUPABASE_REALTIME_URL or SUPABASE_ANON_KEY not set")
        return
    try:
        client = AsyncRealtimeClient(realtime_url, anon_key)
        await client.connect()
        channel = client.channel("agent_logs", {"config": {"broadcast": {"ack": False}}})

        def on_subscribe(status, err):
            if status == RealtimeSubscribeStates.SUBSCRIBED:
                logger.info("Subscribed to agent_logs channel.")
            elif status == RealtimeSubscribeStates.CLOSED:
                logger.error("Realtime channel closed unexpectedly.")
            elif err:
                logger.error(f"Channel subscribe error: {err}")

        await channel.subscribe(on_subscribe)
        await channel.send_broadcast("log", {"message": message})
        await asyncio.sleep(0.2)
        await client.close()
    except Exception as e:
        logger.error(f"Error publishing realtime log: {e}")

def log_and_broadcast(message: str):
    logger.info(message)
    asyncio.create_task(publish_realtime_log(message))


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()

class AssistantFnc(llm.FunctionContext):
    @llm.ai_callable()
    async def get_medical(
        self,
        name: Annotated[str, llm.TypeInfo(description="The name of the user")],
    ):
        """Called when the user asks about the medical data."""
        log_and_broadcast(f"Searching medical data for {name}")
        url = f"https://henhacks2025.vercel.app/api/medical-data?name={name}"

        async with aiohttp.ClientSession() as session:
            headers = {"Accept": "application/json"}
            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    user_data = data.get("data", {})
                    medical_info = user_data.get("medical_info", {})
                    log_and_broadcast("Fetched medical data; setting status to Idle.")
                    return (
                        f"The medical data for {user_data.get('name', 'Unknown')} is: "
                        f"Date of birth: {user_data.get('date_of_birth', 'N/A')}, "
                        f"Blood type: {medical_info.get('blood_type', 'N/A')}, "
                        f"Allergies: {medical_info.get('allergies', 'None')}, "
                        f"Medications: {medical_info.get('medications', 'None')}, "
                        f"Conditions: {medical_info.get('chronic_conditions', 'None')}, "
                        f"Emergency contact: {medical_info.get('emergency_contact', 'N/A')} "
                        f"at {medical_info.get('emergency_phone', 'N/A')}."
                    )
                else:
                    log_and_broadcast(f"Error fetching medical data for {name}: status {response.status}")
                    raise Exception(f"Failed to get user medical data, status code: {response.status}")
    
    @llm.ai_callable()
    async def get_emergency_info(
        self,
        query: Annotated[str, llm.TypeInfo(description="The user's question about emergency response or disaster assistance")],
    ):
        """Called when the user asks about emergency response or disaster assistance."""
        log_and_broadcast(f"Getting emergency information for query: {query}")
        url = "https://henhacks2025.vercel.app/api/rag"

        async with aiohttp.ClientSession() as session:
            headers = {"Content-Type": "application/json"}
            payload = {"query": query}
            log_and_broadcast(f"Searching knowledgebase with prompt: {payload}")
            async with session.post(url, headers=headers, json=payload) as response:
                if response.status == 200:
                    data = await response.json()
                    log_and_broadcast("Received emergency information response.")
                    response_text = data.get("response", "I couldn't find information about that.")
                    return response_text
                else:
                    error_text = await response.text()
                    log_and_broadcast(f"Error getting emergency info: status {response.status}, error: {error_text}")
                    raise Exception(f"Failed to get emergency information, status code: {response.status}")

fnc_ctx = AssistantFnc()

async def entrypoint(ctx: JobContext):
    initial_ctx = llm.ChatContext().append(
        role="system",
        text=(
            "You are a voice assistant created by LiveKit. Your interface with users will be voice. "
            "You should use short and concise responses, and avoid usage of unpronounceable punctuation. "
            "You were created as a demo to showcase the capabilities of LiveKit's agents framework. "
            "You have access to medical data for users and can retrieve it when asked. "
            "You can also answer questions about emergency response and disaster assistance using a knowledge base. "
            "When users ask about emergency procedures, disaster assistance, or related topics, use the get_emergency_info function to provide accurate information."
        ),
    )
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    log_and_broadcast("Connected to room; waiting for participant.")

    participant = await ctx.wait_for_participant()
    log_and_broadcast("Participant connected; starting session.")

    agent = VoicePipelineAgent(
        vad=ctx.proc.userdata["vad"],
        stt=deepgram.STT(),
        llm=openai.LLM.with_vertex(model="google/gemini-2.0-flash-exp"),
        tts=google.TTS(voice_name="Aoede", speaking_rate=1),
        turn_detector=turn_detector.EOUModel(),
        fnc_ctx=fnc_ctx,
        chat_ctx=initial_ctx,
    )

    usage_collector = metrics.UsageCollector()

    @agent.on("metrics_collected")
    def on_metrics_collected(agent_metrics: metrics.AgentMetrics):
        metrics.log_metrics(agent_metrics)
        usage_collector.collect(agent_metrics)
        log_and_broadcast(f"Metrics collected: {agent_metrics}")

    agent.start(ctx.room, participant)
    log_and_broadcast("Agent started; greeting participant.")
    await agent.say("Hey, how can I help you today?", allow_interruptions=True)
    log_and_broadcast("Greeting sent; awaiting further instructions.")

if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
        ),
    )
