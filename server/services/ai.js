import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

export const CONTENT_TYPES = {
  "Blog post": "a blog post with a headline, short intro, subheadings and a conclusion",
  "LinkedIn post": "a LinkedIn post with a strong first line, short paragraphs and a closing question",
  "Email newsletter": "an email newsletter with a subject line, greeting, body sections and a call to action",
  "Product description": "a product description covering benefits first, then key features",
  "Ad copy": "three short ad copy variants, each with a headline and body line",
  "Video script": "a short video script with a hook, scenes and a call to action",
};

const LENGTHS = { Short: "about 150 words", Medium: "about 400 words", Long: "about 800 words" };

// Created lazily so dotenv has loaded before the key is read.
let model;
const getModel = () =>
  (model ??= new ChatOpenAI({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0.7,
    apiKey: process.env.OPENAI_API_KEY,
    maxRetries: 2,
  }));

const parser = new StringOutputParser();

// LangChain chain: prompt -> model -> string
const generatePrompt = ChatPromptTemplate.fromMessages([
  ["system", "You are an expert content writer. Write clear, original, ready-to-publish content in Markdown. Output only the content."],
  ["human", "Write {typeDescription}.\nTopic: {topic}\nTone: {tone}\nAudience: {audience}\nLength: {length}\nKeywords to include naturally: {keywords}"],
]);

const ACTIONS = {
  improve: "Improve clarity, flow and word choice while keeping the meaning and structure.",
  shorten: "Cut the length by about 40% without losing key points.",
  expand: "Expand with more detail, examples and depth, roughly 50% longer.",
  tone: "Rewrite in a {tone} tone while keeping the meaning.",
};

const transformPrompt = ChatPromptTemplate.fromMessages([
  ["system", "You are an expert editor. Return only the revised text in Markdown, with no commentary."],
  ["human", "Instruction: {instruction}\n\nText:\n{text}"],
]);

async function run(prompt, input) {
  try {
    return (await prompt.pipe(getModel()).pipe(parser).invoke(input)).trim();
  } catch (e) {
    const err = new Error(`AI request failed: ${e.message?.slice(0, 160) || "unknown error"}`);
    err.status = 502;
    throw err;
  }
}

export function generateContent({ type, topic, tone, audience, length, keywords }) {
  return run(generatePrompt, {
    typeDescription: CONTENT_TYPES[type],
    topic,
    tone: tone || "Professional",
    audience: audience || "General readers",
    length: LENGTHS[length] || LENGTHS.Medium,
    keywords: keywords || "none",
  });
}

export function transformContent({ action, text, tone }) {
  const instruction = ACTIONS[action].replace("{tone}", tone || "Professional");
  return run(transformPrompt, { instruction, text });
}

export const isAction = (a) => Object.hasOwn(ACTIONS, a);
