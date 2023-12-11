import type { Handler } from '@netlify/functions'
import { parse } from 'querystring'

import { slackApi, verifySlackRequest, blocks, modal } from './util/slack'

function replaceVowelsBy(replacement, str) {
  return str
    .split('')
    .map((letter) =>
      ['a', 'e', 'i', 'o', 'u'].includes(letter)
        ? replacement.toLowerCase()
        : ['A', 'E', 'I', 'O', 'U'].includes(letter)
          ? replacement.toUpperCase()
          : letter,
    )
    .join('')
}

async function handleSlashCommand(payload: SlackSlashCommandPayload) {
  switch (payload.command) {
    case '/mimimimi':
      const response2 = await slackApi('conversations.history', {
        channel: payload.channel_id,
        latest: payload.ts,
        inclusive: true,
        limit: 1,
      })

      const [lastMessage] = response2.messages

      const response = await slackApi('chat.postMessage', {
        channel: payload.channel_id,
        thread_ts: lastMessage.ts,
        username: payload.user_name + '_Malo',
        // icon_emoji: ':trollface:',
        text: `:nerd_face: ${replaceVowelsBy(
          'i',
          lastMessage.text,
        )} :stuck_out_tongue_winking_eye:`,
      })

      if (!response.ok) {
        console.log(response)
      }

      break
    // case '/mimimimi':
    // 	const response = await slackApi(
    // 		'views.open',
    // 		modal({
    // 			id: 'mimimimi-modal',
    // 			title: 'Do a mimimimi',
    // 			trigger_id: payload.trigger_id,
    // 			blocks: [
    // 				blocks.section({
    // 					text: 'lululu trikitraun',
    // 				}),
    // 				blocks.input({
    // 					id: 'noseque',
    // 					label: 'in the hoods',
    // 					placeholder: 'example: ea ea ea',
    // 					initial_value: payload.text ?? '',
    // 					hint: 'noseque poner aqui',
    // 				}),
    // 				blocks.select({
    // 					id: 'spice_level',
    // 					label: 'how spicy is it',
    // 					placeholder: 'select spify level',
    // 					options: [
    // 						{ label: 'mild', value: 'mild' },
    // 						{ label: 'spicy', value: 'spicy' },
    // 					],
    // 				}),
    // 			],
    // 		}),
    // 	)

    // 	if (!response.ok) {
    // 		console.log(response)
    // 	}

    // 	break
    default:
      return {
        statusCode: 200,
        body: `Command ${payload.command} is not recognized`,
      }
  }

  return {
    statusCode: 200,
    body: '',
  }
}

async function handleInteractivity(payload: SlackModalPayload) {
  const callback_id = payload.callback_id ?? payload.view.callback_id

  switch (callback_id) {
    case 'mimimimi-modal':
      const data = payload.view.state.values
      console.log('data', data)
      const fields = {
        opinion: data.noseque_block.noseque.value,
        spiceLevel: data.spice_level_block.spice_level.selected_option.value,
        submitter: payload.user.name,
      }

      await slackApi('chat.postMessage', {
        channel: 'C068D8VA4CB',
        text: `lulululu mimimimi :eyes: <@${payload.user.id}> just mimimimied ${fields.spiceLevel} \n\n ${fields.opinion}`,
      })

      break

    default:
      console.log(`No handler defined for ${callback_id}`)
      return {
        statusCode: 400,
        body: `No handler defined for ${callback_id}`,
      }
  }

  return {
    statusCode: 200,
    body: '',
  }
}

export const handler: Handler = async (event) => {
  const valid = verifySlackRequest(event)

  if (!valid) {
    console.error('invalid request')

    return {
      statusCode: 400,
      body: 'invalid request',
    }
  }

  const body = parse(event.body ?? '') as SlackPayload
  if (body.command) {
    return handleSlashCommand(body as SlackSlashCommandPayload)
  }

  if (body.payload) {
    const payload = JSON.parse(body.payload)
    return handleInteractivity(payload)
  }

  return {
    statusCode: 200,
    body: 'TODO: handle Slack commands and interactivity!!',
  }
}
