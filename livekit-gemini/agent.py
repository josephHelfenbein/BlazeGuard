import logging

from dotenv import load_dotenv
import aiohttp
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


load_dotenv(dotenv_path=".env.local")
logger = logging.getLogger("voice-agent")


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()

class AssistantFnc(llm.FunctionContext):
    @llm.ai_callable()
    async def get_medical(
        self,
        name: Annotated[
            str, llm.TypeInfo(description="The name of the user")
        ],
    ):
        """Called when the user asks about the medical data. This function will return the medical data for the given user name."""
        logger.info(f"getting medical data for {name}")
        url = f"https://henhacks2025.vercel.app/api/medical-data?name={name}"
        logger.info(url)
        async with aiohttp.ClientSession() as session:
            headers = {"Accept": "application/json"}
            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    logger.info(response)
                    data = await response.json() 
                    logger.info(data)
                    user_data = data.get("data", {})
                    medical_info = user_data.get("medical_info", {})

                    return (f"The medical data for {user_data.get('name', 'Unknown')} is: "
                            f"Date of birth: {user_data.get('date_of_birth', 'N/A')}, "
                            f"Blood type: {medical_info.get('blood_type', 'N/A')}, "
                            f"Allergies: {medical_info.get('allergies', 'None')}, "
                            f"Medications: {medical_info.get('medications', 'None')}, "
                            f"Conditions: {medical_info.get('chronic_conditions', 'None')}, "
                            f"Emergency contact: {medical_info.get('emergency_contact', 'N/A')} "
                            f"at {medical_info.get('emergency_phone', 'N/A')}.")
                else:
                    raise Exception(f"Failed to get user medical data, status code: {response.status}")


fnc_ctx = AssistantFnc()

async def entrypoint(ctx: JobContext):
    initial_ctx = llm.ChatContext().append(
        role="system",
        text=(
            "You are a voice assistant created by LiveKit. Your interface with users will be voice. "
            "You should use short and concise responses, and avoiding usage of unpronouncable punctuation. "
            "You were created as a demo to showcase the capabilities of LiveKit's agents framework."
        ),
    )

    logger.info(f"connecting to room {ctx.room.name}")
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # Wait for the first participant to connect
    participant = await ctx.wait_for_participant()
    logger.info(f"starting voice assistant for participant {participant.identity}")

    # This project is configured to use Deepgram STT, OpenAI LLM and Cartesia TTS plugins
    # Other great providers exist like Cerebras, ElevenLabs, Groq, Play.ht, Rime, and more
    # Learn more and pick the best one for your app:
    # https://docs.livekit.io/agents/plugins
    agent = VoicePipelineAgent(
        vad=ctx.proc.userdata["vad"],
        stt=deepgram.STT(),
        llm=openai.LLM.with_vertex(model="google/gemini-2.0-flash-exp"),
        tts=google.TTS(
            voice_name="Aoede",
            speaking_rate=1,
        ),
        turn_detector=turn_detector.EOUModel(),
        fnc_ctx=fnc_ctx,
        chat_ctx=initial_ctx,
    )

    usage_collector = metrics.UsageCollector()

    @agent.on("metrics_collected")
    def on_metrics_collected(agent_metrics: metrics.AgentMetrics):
        metrics.log_metrics(agent_metrics)
        usage_collector.collect(agent_metrics)

    agent.start(ctx.room, participant)

    # The agent should be polite and greet the user when it joins :)
    await agent.say("Hey, how can I help you today?", allow_interruptions=True)


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
        ),
    )
