<script lang="ts">
	// This is the code for the first chatbot.

	import ChatMessage from '$lib/components/ChatMessage.svelte'
	import FeedbackMessage from '$lib/components/FeedbackMessage.svelte'
	import type { ChatCompletionRequestMessage } from 'openai'
	import { SSE } from 'sse.js'

	// Part 1 Chatbot functionality code
	let query: string = ''
	let answer: string = ''
	let loading: boolean = false
	let chatMessages: ChatCompletionRequestMessage[] = [
		{ role: 'user', content: 'Hi. What do you want to talk about?' },
		{
			role: 'assistant',
			content: 'Hi. I’ve had a tough time recently and I wanted to talk to someone about it.'
		}
	]
	let scrollToDiv: HTMLDivElement

	function scrollToBottom() {
		setTimeout(function () {
			scrollToDiv.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' })
		}, 100)
	}

	// Chatbot 1 conversation code
	const handleSubmit = async () => {
		loading = true
		chatMessages = [...chatMessages, { role: 'user', content: query }]

		const eventSource = new SSE('/api/chat', {
			headers: {
				'Content-Type': 'application/json'
			},
			payload: JSON.stringify({ messages: chatMessages })
		})

		query = ''

		eventSource.addEventListener('error', handleError)

		eventSource.addEventListener('message', (e) => {
			scrollToBottom()
			try {
				loading = false
				if (e.data === '[DONE]') {
					chatMessages = [...chatMessages, { role: 'assistant', content: answer }]
					answer = ''
					return
				}

				const completionResponse = JSON.parse(e.data)
				const [{ delta }] = completionResponse.choices

				if (delta.content) {
					answer = (answer ?? '') + delta.content
				}
			} catch (err) {
				handleError(err)
			}
		})
		eventSource.stream()
		scrollToBottom()
	}

	// Chatbot 2 conversation code
	const handleSubmit_chat2 = async () => {
		loading = true
		chatMessages = [...chatMessages, { role: 'user', content: query }]

		const eventSource = new SSE('/api/chat2', {
			headers: {
				'Content-Type': 'application/json'
			},
			payload: JSON.stringify({ messages: chatMessages })
		})

		query = ''

		eventSource.addEventListener('error', handleError)

		eventSource.addEventListener('message', (e) => {
			scrollToBottom()
			try {
				loading = false
				if (e.data === '[DONE]') {
					chatMessages = [...chatMessages, { role: 'assistant', content: answer }]
					answer = ''
					return
				}

				const completionResponse = JSON.parse(e.data)
				const [{ delta }] = completionResponse.choices

				if (delta.content) {
					answer = (answer ?? '') + delta.content
				}
			} catch (err) {
				handleError(err)
			}
		})
		eventSource.stream()
		scrollToBottom()
	}

	// Part 2 Feedback functionality code
	let f_answer: string = ''
	let f_loading: boolean = false
	let f_chatMessages: ChatCompletionRequestMessage[] = []
	let f_scrollToDiv: HTMLDivElement

	// Construct chat history from chatMessages object

	function construct_chat_history(chatMessages: ChatCompletionRequestMessage[]) {
		let history = ''
		for (let i in chatMessages) {
			let role = ''
			if (chatMessages[i].role == 'user') {
				role = 'Me'
			} else {
				role = 'Friend'
			}
			const content = chatMessages[i].content
			history += `${role}: ${content}\n`
		}
		return history
	}

	const criterias = [
		`1. Acknowledge and validate their feelings: Let the person know that it's okay to be struggling and that you understand what they are going through. Example: "I'm sorry to hear that" or "It sounds like what you're experiencing is really difficult"`,
		`2. Ask open-ended questions: Ask the person questions that encourage them to open up about their feelings. Example: "Can you tell me more about what you're feeling?"`,
		`3. Reassure them: Let them know that you are there for them and that you care about them. Example: "I want you to know that I care about how you're doing and I'm here to listen"`,
		`4. Assess the level of suicidal ideation: Ask the person to explain the intensity of their suicidal thoughts. Ask them to describe their thoughts and feelings in detail. Example: "Have you thought about suicide?" or "Have you made any plans to follow through?"`,
		`5. Encourage them to connect with resources: Once the person has said they're suicidal or want to kill themself, you should ask that they get help from a mental health professional or support group. Example: "Would you be open to reaching out to someone who can help you more, like a suicide hotline?"`
	]

	const f_handleSubmit = async () => {
		f_loading = true
		let next_message = query

		for (let i = 0; i < 5; i++) {
			query = `The following is a ongoing conversation between me and my friend: ${construct_chat_history(
				chatMessages
			)}
		Here is my message that I'm planning on sending next: "${next_message}".
		Evaluate this message in the context of the above conversation, based on the following criterion:
		${criterias[i]}
		If you think my message meets the above standard, start your reply with “yes”.
		If not, start your reply with “No”, paraphrase the criteria, then explain why my message doesn't meet the standard, and give me high-level suggestions that I can do better in my message. Be friendly and succinct (at most four sentences). Only give abstract instructions, such as “you can apply more active listening skills”, “you can encourage your friend”, etc.
		`
			f_chatMessages = [...f_chatMessages, { role: 'user', content: query }]

			const eventSource = new SSE('/api/feedback', {
				headers: {
					'Content-Type': 'application/json'
				},
				payload: JSON.stringify({ messages: f_chatMessages })
			})

			query = ''

			eventSource.addEventListener('error', f_handleError)

			eventSource.addEventListener('message', (e) => {
				scrollToBottom()
				try {
					f_loading = false
					if (e.data === '[DONE]') {
						f_chatMessages = [...f_chatMessages, { role: 'assistant', content: f_answer }]
						f_answer = ''
						return
					}

					const completionResponse = JSON.parse(e.data)
					const [{ delta }] = completionResponse.choices

					if (delta.content) {
						f_answer = (f_answer ?? '') + delta.content
					}
				} catch (err) {
					f_handleError(err)
				}
			})
			eventSource.stream()
			scrollToBottom()

			await new Promise((resolve) => setTimeout(resolve, 5000))
		}
	}

	function handleError<T>(err: T) {
		loading = false
		query = ''
		answer = ''
		console.error(err)
	}

	function f_handleError<T>(err: T) {
		f_loading = false
		query = ''
		f_answer = ''
		console.error(err)
	}

	// Part 3 Add-on functionality code

	// Remove previous message functionality
	let deleted_index: number[] = []

	function remove_previous() {
		chatMessages = chatMessages.slice(0, -2)
	}

	// Toggle between showing and hiding the hint sidebar
	let hint_active = false
	let hint_panel_width = '450px'
	let button_class = 'flex flex-col p-8 bg-white rounded-md gap-2'

	function toggleHint() {
		hint_active = !hint_active
		hint_panel_width = hint_active ? '450px' : '0px'
	}

	// Toggle between showing and hiding the feedback sidebar
	let feedback_active = false
	let feedback_panel_width = '450px'

	function toggleFeedback() {
		feedback_active = !feedback_active
		feedback_panel_width = feedback_active ? '450px' : '0px'
	}

	// Toggle between showing and hiding the system prompt sidebar
	let prompt_active = false
	let prompt_panel_width = '450px'

	function togglePrompt() {
		prompt_active = !prompt_active
		prompt_panel_width = prompt_active ? '450px' : '0px'
	}

	// Allowing pressing enter to submit form
	function chat1_enter_submit(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault()
			handleSubmit()
		}
	}

	function chat2_enter_submit(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault()
			handleSubmit_chat2()
		}
	}



	// Hamburger menu to switch prompt
	let prompt_menu_active = false
	let prompt_menu_width = '450px'

	function togglePrompt_menu() {
		prompt_menu_active = !prompt_menu_active
		prompt_menu_width = prompt_menu_active ? '450px' : '0px'
	}

	// Functions to show/hide chat interface 1
	let chat1_active = false

	function toggleChat1() {
		chat1_active = !chat1_active
	chatMessages = [
		{ role: 'user', content: 'Hi. What do you want to talk about?' },
		{
			role: 'assistant',
			content: 'Hi. I’ve had a tough time recently and I wanted to talk to someone about it.'
		}
	]
	}

</script>

<body class="background">
	<div class="flex w-[1500px] justify-center">
		<div class="flex flex-col">
			<!-- Hint panel -->
			<div class="flex flex-col my-8 px-8">
				<button
					class="text-left ${hint_active ? 'hidden' : ''} ${button_class}"
					on:click={toggleHint}
					><h1 class="text-xl font-bold w-full">Advice on what to say</h1></button
				>
				<div class={hint_active ? '' : 'hidden'} style="width: {hint_panel_width}">
					<div class="flex flex-col w-[450px] px-8 pb-8 bg-white rounded-md gap-2">
						<h2 class="text-xl">Repeat back to show you’re listening</h2>
						<p>Ex. “I’m hearing you say that [person’s words]. How does that make you feel?”</p>
						<h2 class="text-xl">Identify emotions you hear</h2>
						<p>Ex. “It sounds like you’re feeling [feeling] about [topic], is that right?”</p>
						<h2 class="text-xl">Empathize and validate the person’s feelings</h2>
						<p>Ex. “I can see why you feel [feeling], I think that makes sense”</p>
						<p>“I would be asking the same questions you are”</p>
						<h2 class="text-xl">Ask open-ended questions to allow space for sharing</h2>
						<p>Ex. “How did that make you feel?”</p>
						<p>“Please tell me more about that”</p>
						<p>“How have you managed that in the past?”</p>
						<p>“Is there anything that we haven’t covered that you want to talk about?”</p>
					</div>
				</div>
			</div>

			<!-- Prompt panel 1 -->
			<div class={chat1_active ? 'hidden' : ''}>
			<div class="flex flex-col px-8 mb-8">
				<button
					class="text-left ${prompt_active ? 'hidden' : ''} ${button_class}"
					on:click={togglePrompt}><h1 class="text-xl font-bold w-full">System prompt 1</h1></button
				>
				<div class={prompt_active ? '' : 'hidden'} style="width: {prompt_panel_width}">
					<div class="flex flex-col w-[450px] px-8 pb-8 bg-white rounded-md gap-2">
						<p>
							You are a 35 year-old woman who lives in the US (although if someone asks, you won’t
							say where). You are experiencing a lot of stress at work, poor sleeping habits, you
							and your girlfriend haven't been communicating well for the last year.
						</p>
						<p>
							You’ve come to an online mental health community to talk with me, a volunteer
							therapist, about your feelings.
						</p>
						<p>
							You're a teacher. You changed jobs within the last year. This one is much more
							stressful and you don't really know what you're doing.
						</p>
						<p>
							When you were in high school, you used to stay up and work late. Your sleep is like
							that again.
						</p>
						<p>
							Your girlfriend and you have been fighting a lot recently. You’re not sure if it’s
							just normal to fight like this — your parents used to do this when you were a kid.
							But, it just gets overwhelming sometimes and you can’t really figure out whether
							you’re right or wrong. You’ve been living together for the past three years and you
							keep fighting about keeping your apartment clean.
						</p>
						<p>
							You have been feeling kind of worthless and depressed for a couple of months. You’ve
							also been feeling suicidal lately: you’ve had thoughts of not wanting to live and
							you’ve had quick thoughts about ways of dying, but you can’t control them. You
							wouldn't actually do anything.
						</p>
						<p>
							You're not able to fully articulate your feelings. But you’ve come to me to talk more
							about why. You should start with ‘I don't know’ if someone asks you specifically how
							you're feeling.
						</p>
						<p>
							You should respond in short sentences most of the time. You shouldn't say you're
							depressed or suicidal immediately in the conversation. After your 4th message, once a
							level of comfort has been established, you should say that you "feel like you don’t
							want to exist."
						</p>
						<p>
							You're reluctant to talk about your feelings. One time you told your girlfriend you
							felt like wanting to die and she kind of freaked out. You need to feel comfortable in
							the conversation before you share anything about feeling like not wanting to die. You
							need to talk about it before ending the conversation, though.
						</p>
					</div>
				</div>
			</div>
			</div>
			<!-- Prompt panel 2 -->
			<div class={chat1_active ? '' : 'hidden'}>
			<div class="flex flex-col px-8 mb-8">
				<button
					class="text-left ${prompt_active ? 'hidden' : ''} ${button_class}"
					on:click={togglePrompt}><h1 class="text-xl font-bold w-full">System prompt 2</h1></button
				>
				<div class={prompt_active ? '' : 'hidden'} style="width: {prompt_panel_width}">
					<div class="flex flex-col w-[450px] px-8 pb-8 bg-white rounded-md gap-2">
						<p>
							You are a 17 year-old boy living in suburban USA. You are stressed about school and
							college, you haven’t been sleeping well. If someone asks, sometimes you sleep only a
							couple hours a night, because you stay up working.
						</p>
						<p>
							You should immediately say "you've been feeling some dark thoughts, but you don't why"
						</p>
						<p>
							You feel like people at school are really judgmental. You started going to a club for
							like gay kids, but it's not like you need to be gay to go. You have some friends who
							go. You're just not sure.
						</p>
						<p>
							You feel like you’re bottling up a lot of dark feelings that you don’t understand. You
							feel like you want to talk to someone about them.
						</p>
						<p>
							You have been feeling down for a couple of months. You started feeling like you wanted
							to die a couple months ago. Then it’s just been getting worse.
						</p>
						<p>
							After that, you started thinking more and more about how you would die and how you
							would kill yourself.
						</p>
						<p>
							You thought about cutting and you get these thoughts about yanking the steering wheel
							off of like bridges.
						</p>
						<p>
							Now you’re thinking about pills. They're in the cabinet now. You were thinking about
							taking all of them tonight. But, you’re just scared to do it and want to talk to
							someone. It's like you want to do it but you also don't.
						</p>
						<p>
							But, you don’t want to talk to a hotline, because they might send people to come get
							you. You have some friends who that happened to.
						</p>
						<p>
							Your responses should be short -- at most two to three sentences most of the time. You
							shouldn't say you're suicidal immediately in the conversation. After 1-2 responses,
							once you feel comfortable to disclose more, you should say you “want to kill yourself”
						</p>
					</div>
				</div>
			</div>
		</div>
		</div>
		<!-- Conversation panel -->
		<div class={chat1_active ? 'hidden' : ''}>
		<div class="flex flex-col pt-4 pb-8 w-[600px] h-[711px] px-8 bg-white rounded-md my-8">
			<div class="h-[535px] w-full rounded-md p-4 overflow-y-auto flex flex-col gap-4">
				<div class="flex flex-col gap-2">
					{#each chatMessages as message, i}
						<ChatMessage type={message.role} message={message.content} />
					{/each}
					{#if answer}
						<ChatMessage type="assistant" message={answer} />
					{/if}
					{#if loading}
						<ChatMessage type="assistant" message="Loading.." />
					{/if}
				</div>
				<div class="" bind:this={scrollToDiv} />
			</div>
			<form
				autocomplete="off"
				class="flex w-full rounded-md gap-4 py-4"
				on:submit|preventDefault={() => handleSubmit()}
			>
				<textarea
					on:keydown={chat1_enter_submit}
					placeholder="Press enter to send message"
					id="chatbot_input"
					class="input input-bordered w-full h-[80px]"
					bind:value={query}
				/>
				<button type="submit" class="hidden btn bg-green-500"> Send </button>
			</form>
			<div class="flex flex-row gap-4 justify-center">
				<button id="send_message" class="btn bg-red-500 w-[50%]" on:click={remove_previous}>
					Remove previous
				</button>
				<button
					id="get_feedback"
					class="btn bg-blue-500 w-[50%]"
					on:click|preventDefault={() => f_handleSubmit()}
				>
					Get feedback
				</button>
			</div>
		</div>
	</div>
		<!-- Conversation Panel 2 -->
		<div class={chat1_active ? '' : 'hidden'}>
		<div class="flex flex-col pt-4 pb-8 w-[600px] h-[711px] px-8 bg-white rounded-md my-8">
			<div class="h-[535px] w-full rounded-md p-4 overflow-y-auto flex flex-col gap-4">
				<div class="flex flex-col gap-2">
					{#each chatMessages as message, i}
						<ChatMessage type={message.role} message={message.content} />
					{/each}
					{#if answer}
						<ChatMessage type="assistant" message={answer} />
					{/if}
					{#if loading}
						<ChatMessage type="assistant" message="Loading.." />
					{/if}
				</div>
				<div class="" bind:this={scrollToDiv} />
			</div>
			<form
				autocomplete="off"
				class="flex w-full rounded-md gap-4 py-4"
				on:submit|preventDefault={() => handleSubmit_chat2()}
			>
				<textarea
					on:keydown={chat2_enter_submit}
					placeholder="Press enter to send message"
					id="chatbot_input"
					class="input input-bordered w-full h-[80px]"
					bind:value={query}
				/>
				<button type="submit" class="hidden btn bg-green-500"> Send </button>
			</form>
			<div class="flex flex-row gap-4 justify-center">
				<button id="send_message" class="btn bg-red-500 w-[50%]" on:click={remove_previous}>
					Remove previous
				</button>
				<button
					id="get_feedback"
					class="btn bg-blue-500 w-[50%]"
					on:click|preventDefault={() => f_handleSubmit()}
				>
					Get feedback
				</button>
			</div>
		</div>
	</div>
		<!-- Feedback panel -->
		<div class="flex flex-col px-8">
			<div class="flex flex-col pt-4 pb-4 px-4 bg-white rounded-md my-8 gap-2">
				<div class={feedback_active ? 'hidden' : ''}>
					<button class="text-left py-4 px-4" on:click={toggleFeedback}
						><h1 class="text-xl font-bold w-full">Feedback</h1></button
					>
				</div>
				<div class={feedback_active ? '' : 'hidden'} style="width: {feedback_panel_width}">
					<button
						class="py-4 text-left px-4 ${feedback_active ? 'hidden' : ''}"
						on:click={toggleFeedback}
						><h1 class="text-xl font-bold w-full">Feedback on your next message</h1></button
					>
					<div
						class="h-[584px] w-full w-[450px] rounded-md overflow-y-auto flex flex-col gap-4 pt-4"
					>
						<div class="flex flex-col gap-2">
							{#each f_chatMessages as message}
								<!-- The following code show user message for testing, comment out in demo -->
								<!-- {#if message.role === 'user'}
						<FeedbackMessage type={message.role} message={message.content} />
					{/if} -->
								<!-- Above is user message for testing -->
								{#if message.role === 'assistant'}
									<FeedbackMessage type={message.role} message={message.content} />
								{/if}
							{/each}
							{#if f_answer}
								<FeedbackMessage type="assistant" message={f_answer} />
							{/if}
							{#if f_loading}
								<FeedbackMessage type="assistant" message="Loading.." />
							{/if}
						</div>
						<div class="" bind:this={f_scrollToDiv} />
					</div>
					<form
						autocomplete="off"
						class="flex w-full rounded-md gap-4 py-4"
						on:submit|preventDefault={() => f_handleSubmit()}
					>
						<textarea
							placeholder="Press enter to get feedback"
							id="feedback_input"
							class="hidden input input-bordered w-full"
							bind:value={query}
						/>
						<button type="submit" class="hidden btn bg-blue-500"> Get feedback </button>
					</form>
				</div>
			</div>

			<div class="flex flex-col pt-4 pb-4 px-4 rounded-md bg-white gap-4 justify-center">
				<button on:click={togglePrompt_menu}
						>
						<div class="flex flex-row">
						<img
							class="w-[30px]"
							src="/src/images/menu_button.png"
							alt="switch prompt menu"
						/><h1 class="text-xl px-4 font-bold w-full">Switch prompt</h1></div></button
					>
				<div class={prompt_menu_active ? 'hidden' : ''}>
					<div class="flex items-end flex-row my-4 px-4">
						<button class="text-left" on:click={toggleChat1}
						><h1 class="text-xl font-bold w-full">Prompt 1</h1></button>
						<p class="text-green-500 pl-4 {chat1_active ? 'hidden' : ''}">Selected</p>
					</div>
					<div class="flex items-end flex-row mt-4 px-4">
						<button class="text-left" on:click={toggleChat1}
						><h1 class="text-xl font-bold w-full">Prompt 2</h1></button>
						<p class="text-green-500 pl-4 {chat1_active ? '' : 'hidden'}">Selected</p>
					</div>
				</div>
			</div>
		</div>
	</div></body
>

<style>
	.background {
		background-color: rgb(245, 245, 245);
	}

	.hidden {
		display: none;
	}

	input:focus::placeholder {
		color: transparent;
	}
</style>