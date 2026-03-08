import fs from "fs";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const script = `
AI Intake Assistant (female):
Hello, L C I Demo Law Firm, how may I help you?

Caller (male):
Hi, I was in a car accident last night in Scranton and I'm not sure what I should do. Someone told me to call a lawyer.

AI Intake Assistant:
I'm sorry to hear about your accident. I can collect a few details so the attorney can review your situation. May I ask when the accident occurred and whether anyone was injured?

Caller:
It happened around 9 pm last night. My neck and back are hurting today.

AI Intake Assistant:
Thank you. I’ll record that for the attorney. May I also have your name and phone number so the firm can contact you?

Caller:
Yes, my name is John Smith and my number is 302-555-1023.

AI Intake Assistant:
Thank you, John. I will send this information to the attorney and someone from the firm will follow up with you soon.

Caller:
Wait one second, do you think I can meet with the lawyer today?

AI Intake Assistant:
One second. It looks like you will get a call back today. So, yes. Is there anything else I can help you with?
`;

async function generate() {
  const response = await openai.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: "alloy",
    input: script
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync("sample-intake-call.mp3", buffer);
  console.log("Audio file created: sample-intake-call.mp3");
}

generate();