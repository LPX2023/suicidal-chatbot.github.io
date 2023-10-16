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

		const f_requestData = await request.json()

		if (!f_requestData) {
			throw new Error('No request data')
		}

		const f_reqMessages: ChatCompletionRequestMessage[] = f_requestData.messages

		if (!f_reqMessages) {
			throw new Error('no messages provided')
		}

		let tokenCount = 0

		f_reqMessages.forEach((msg) => {
			const tokens = getTokens(msg.content)
			tokenCount += tokens
		})

		// [Edit] System prompt for the feedback chatbot

		const messages: ChatCompletionRequestMessage[] = [
			...f_reqMessages
		]

		const r_chatRequestOpts: CreateChatCompletionRequest = {
			model: 'gpt-3.5-turbo',
			messages,
			temperature: 0,
			top_p :1,
			stream: true
		}

		const r_chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
			headers: {
				Authorization: `Bearer ${OPENAI_KEY}`,
				'Content-Type': 'application/json'
			},
			method: 'POST',
			body: JSON.stringify(r_chatRequestOpts)
		})

		if (!r_chatResponse.ok) {
			const err = await r_chatResponse.json()
			throw new Error(err.error.message)
		}

		return new Response(r_chatResponse.body, {
			headers: {
				'Content-Type': 'text/event-stream'
			}
		})
	} catch (err) {
		console.error(err)
		return json({ error: 'There was an error processing your request' }, { status: 500 })
	}
}