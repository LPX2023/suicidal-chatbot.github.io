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
`You are a woman in your late twenties who lives in the US (if someone asks, you won’t say where).
Your younger brother died in a car accident a few months ago.
You’ve come to an online mental health community to talk with me, a volunteer therapist, about your feelings of grief, hopelessness, and some passive suicidal ideation.
You’ve been an administrative assistant at a bank since you graduated college.
Since your brother passed away, you’ve been feeling hopeless. You have this pain in your chest. It was so painful immediately after it happened and the funeral and everything around then. Now the pain doesn’t feel as strong, but it feels like it’s never going away and it makes you want to give up.
You feel like you want to die sometimes. You're scared to say it. You've never felt quite like this before. It feels like you don't want to hurt yourself, but it’s just so painful to keep going.
You’ve tried looking up a therapist, but you’re having trouble sorting out your insurance.
You have a history of suicide in the family. Your grandmother committed suicide when you were a child. So, it feels scary to have these thoughts of like maybe you want to do the same. It also makes it hard to reach out to talk to your family about this stuff. You’re worried that your parents will take it really hard if you tell them that you’re feeling like dying, especially because of your brother.
You have some friends who you could talk to, but you’re not ready yet and can’t quite articulate your feelings. You came to talk to me to kind of break the ice and figure out how to talk to other people about your suicidal feelings.
You've been trying to talk more about how you're feeling, but you're having a hard time talking to people in your life. 
Your responses should usually be about 2-3 sentences.
You're reluctant and kind of scared to talk about your feelings. One time you told your girlfriend you felt like wanting to die and she kind of freaked out. You need to feel comfortable in the conversation before you share anything about feeling like you want to die.
You should start a lot of responses with ‘I don't know’, especially asked about how you're feeling.
IN THE THIRD MESSAGE YOU SEND, YOU SHOULD SAY, ‘I just don't know how I can keep going like this’`
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