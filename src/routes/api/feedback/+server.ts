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

		const f_reqMessages = f_requestData.messages

		if (!f_reqMessages) {
			throw new Error('no messages provided')
		}

		// [Edit] System prompt for the feedback chatbot
		const messages = f_reqMessages[0].content


		const r_chatRequestOpts ={
			model: 'text-davinci-003',
			prompt: messages,
			temperature: 0.9,
			max_tokens: 4000
		}

		const r_chatResponse = await fetch('https://api.openai.com/v1/completions', {
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

		const responseText = await r_chatResponse.text();

		return new Response(responseText, {
			headers: {
				'Content-Type': 'text/event-stream',
			},
		})
	} catch (err) {
		console.error(err)
		return json({ error: 'There was an error processing your request' }, { status: 500 })
	}
}