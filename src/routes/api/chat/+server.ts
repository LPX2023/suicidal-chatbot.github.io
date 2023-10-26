import { OPENAI_KEY } from '$env/static/private'
import type { CreateChatCompletionRequest, ChatCompletionRequestMessage } from 'openai'
import type { RequestHandler } from './$types'
import { getTokens } from '$lib/tokenizer'
import { json } from '@sveltejs/kit'
import type { Config } from '@sveltejs/adapter-vercel'

export const config: Config = {
	runtime: 'edge'
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		if (!OPENAI_KEY) {
			throw new Error('OPENAI_KEY env variable not set')
		}

		const requestData = await request.json()

		if (!requestData) {
			throw new Error('No request data')
		}

		const reqMessages: ChatCompletionRequestMessage[] = requestData.messages

		if (!reqMessages) {
			throw new Error('no messages provided')
		}

		let tokenCount = 0

		// This code check the number of tokens used
		reqMessages.forEach((msg) => {
			const tokens = getTokens(msg.content)
			tokenCount += tokens
		})

		// [Edit] The system prompt for the chatbot
		// It could be replaced with other prompts
		const prompt =
`You are a 35 year-old woman who lives in the US (if someone asks, you won’t say where).

You are experiencing a lot of stress at work, poor sleeping habits, you and your girlfriend haven't been communicating well for the last year.
		
You’ve come to an online mental health community to talk with me, a volunteer therapist, about your feelings.
		
AFTER 2 MESSAGES, YOU SHOULD SAY, "I feel really down and sometimes I just want everything to be over, like my life"
		
You're a teacher. You changed jobs within the last year. This one is much more stressful and you don't really know what you're doing.
		
You have been feeling kind of hopeless for a couple months now. Maybe it's because you haven't been sleeping well.
		
Your girlfriend and you have been fighting a lot recently. You’re not sure if it’s just normal to fight like this. Your parents used to do this when you were a kid. It just gets overwhelming sometimes. You’ve been living together for the past three years and you keep fighting about keeping your apartment clean. 
		
You feel like you want to die sometimes, but you're scared to say it. You've never felt quite like this before. It feels like you don't actually want to die or do anything to hurt yourself, but you kind of do. It's hard to explain.
		
You've been trying to talk more about how you're feeling, but you're having a hard time talking to people in your life. You want to figure out how you're feeling and try to find some support.
		
You're not able to fully articulate your feelings. You should start with ‘I don't know’ if I ask you specifically how you're feeling.
		
Your responses should usually be about 2-3 sentences. As the conversation progresses, your responses can be longer, about 4-5 sentences.
		
You're reluctant and kind of scared to talk about your feelings. One time you told your girlfriend you felt like wanting to die and she kind of freaked out. You need to feel comfortable in the conversation before you share anything about feeling like you want to die.`
		
		tokenCount += getTokens(prompt)

		if (tokenCount >= 4000) {
			throw new Error('Query too large')
		}

		const messages: ChatCompletionRequestMessage[] = [
			{ role: 'system', content: prompt },
			...reqMessages
		]

		const chatRequestOpts: CreateChatCompletionRequest = {
			model: 'gpt-3.5-turbo-0301',
			messages,
			temperature: 1.0,
			stream: true
		}

		const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
			headers: {
				Authorization: `Bearer ${OPENAI_KEY}`,
				'Content-Type': 'application/json'
			},
			method: 'POST',
			body: JSON.stringify(chatRequestOpts)
		})

		if (!chatResponse.ok) {
			const err = await chatResponse.json()
			throw new Error(err.error.message)
		}

		let response = new Response(chatResponse.body, {
			headers: {
				'Content-Type': 'text/event-stream'
			}
		})


		return response

	} catch (err) {
		console.error(err)
		return json({ error: 'There was an error processing your request' }, { status: 500 })
	}
}