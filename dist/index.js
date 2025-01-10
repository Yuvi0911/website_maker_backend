"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const express_1 = __importDefault(require("express"));
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const node_1 = require("./defaults/node");
const react_1 = require("./defaults/react");
const prompts_1 = require("./prompts");
const cors_1 = __importDefault(require("cors"));
const groq = new groq_sdk_1.default({ apiKey: process.env.GROQ_API_KEY });
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// async function main() {
//     const completion = await groq.chat.completions
//       .create({
//         messages: [
//           {
//             role: "user",
//             content: "what is 2 + 2",
//           },
//         ],
//         model: "llama3-8b-8192",
//       })
//     console.log(completion.choices[0].message.content);
//   }
// main();
// jab bhi user prompt daal kr enter krega koi website bnane k liye toh sbse phle ye endpoint hit hoga aur vo prompt llm k paas jaiye ga aur llm btaye ga ki website bnane k liye konsi language use krni h.
app.post("/template", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // req.body me se prompt(create a todo website) ko lege jo user bhejega.
    const prompt = req.body.prompt;
    // ai model se puchege ki user ne jo prompt bheja h website bnane k liye toh usne kis language ki demand kri h website bnane k liye. AI system react aur node me se 1 ko choose krega kyoki humne humari website me keval inhi 2 language ka prompt diya h website bnane k liye.
    const response = yield groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content: "Return either 'node' or 'react' based on what you think this project should be. Only return a single word: either 'node' or 'react'. Do not return anything extra.",
            },
            {
                role: "user",
                content: prompt,
            },
        ],
        model: "llama3-8b-8192",
        max_tokens: 200,
    });
    // AI model ne jo 1 naam select kiya h ushe answer me store krva dege.
    const answer = response.choices[0].message.content.trim();
    // yadi react select kiya h toh ye execute hoga
    if (answer === "react") {
        res.json({
            prompts: [prompts_1.BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${react_1.basePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
            uiPrompts: [react_1.basePrompt]
        });
        return;
    }
    // yadi node select kiya h toh ye execute hoga
    if (answer === "node") {
        res.json({
            prompts: [`Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${react_1.basePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
            uiPrompts: [node_1.basePrompt]
        });
        return;
    }
    res.status(403).json({
        message: "You can't access this"
    });
    return;
}));
// iski help se 3 main prompt LLM k paas jaiye ge aur hamari website ka code hume milega.
// hume isme streaming ka feature add krna h jisse hum thoda thoda data jo load ho chuka h ushe show kr skhte h yadi hum streaming add nhi krte h toh jab toh pura data generate nhi ho jata tab tak user ko kuch bhi show nhi hoga aur pura data generate hone me time bhi jyada lgta h.
app.post("/chat", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const messages = req.body.messages;
    const response = yield groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content: (0, prompts_1.getSystemPrompt)()
            },
            ...messages
        ],
        model: "llama3-8b-8192",
        max_tokens: 8000,
    });
    console.log(response);
    res.json({
        response: response.choices[0].message.content
    });
    // try {
    //     // Get the stream from the Groq API
    //     const stream = await groq.chat.completions.create({
    //         messages: [
    //             {
    //                 role: "system",
    //                 content: getSystemPrompt() // Optional system prompt
    //             },
    //             ...messages
    //         ],
    //         model: "llama3-8b-8192",  // Model used
    //         max_tokens: 8000,  // Max tokens to generate
    //         stream: true,  // Enable streaming
    //     });
    //     // Set headers for Server-Sent Events (SSE)
    //     res.setHeader("Content-Type", "text/event-stream");
    //     res.setHeader("Cache-Control", "no-cache");
    //     res.setHeader("Connection", "keep-alive");
    //     // Stream the data to the client
    //     for await (const chunk of stream) {
    //         // Print each chunk of the response to the console
    //         console.log(chunk.choices[0]?.delta?.content || "");
    //         // Send the chunk as SSE to the client
    //         res.write(`data: ${JSON.stringify(chunk.choices[0]?.delta?.content || "")}\n\n`);
    //     }
    //     // End the SSE stream when done
    //     res.write("data: [DONE]\n\n");
    //     res.end();
    // } catch (error) {
    //     console.error("Error during streaming:", error);
    //     res.status(500).json({ error: "An error occurred while processing the request." });
    // }
}));
app.listen(3000);
