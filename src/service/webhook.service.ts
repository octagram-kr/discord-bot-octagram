import { createHmac } from "crypto";
import { Client, TextChannel } from "discord.js";
import { eq } from 'drizzle-orm'
import { EventBus } from "@/core/event-bus";
import { db } from "@/db";
import { githubWebhookChannelTable } from "@/db/schema";
import type { 
  IssuesEvent,
  PullRequestEvent,
  PushEvent,
  WebhookEvent,
  WebhookEventName,
} from '@octokit/webhooks-types';
import type { SummarizePrEvent } from "@/types/events";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || ''

export class WebhookService {
  private client: Client;
  private eventBus: EventBus;
  private server: Bun.Server | null = null;

  constructor(client: Client) {
    this.client = client;
    this.eventBus = EventBus.getInstance();
  }

  start() {
    if (this.server) {
      console.log('Webhook server is already running');
      return;
    }
    this.server = Bun.serve({
      port: (() => {
        const val = process.env.WEBHOOK_PORT;
        const num = val !== undefined ? parseInt(val, 10) : NaN;
        return isNaN(num) ? 3000 : num;
      })(),
      fetch: async (req) => {
        const url = new URL(req.url);
        if (url.pathname === '/webhook' && req.method === 'POST') {
          try {
            const payload = await req.text();
            const signature = req.headers.get('x-hub-signature-256');
            const event = req.headers.get('x-github-event') as WebhookEventName;
            if (signature && !this.verifyGitHubWebhook(payload, signature)) {
              console.error('Webhook signature verification failed');
              return new Response('Unauthorized', { status: 401 });
            }
            if (event) {
              const parsedPayload = JSON.parse(payload) as WebhookEvent;
              this.handleGitHubWebhook(event, parsedPayload);
            }
            return new Response('OK', { status: 200 });
          } catch (error) {
            console.error('Webhook processing error:', error);
            return new Response('Internal Server Error', { status: 500 });
          }
        }
        if (url.pathname === '/health') {
          return new Response('Server is running', { status: 200 });
        }
        return new Response('Not Found', { status: 404 });
      }
    });
    console.log(`Webhook server started on port ${this.server.port}`);
  }

  stop() {
    if (this.server) {
      this.server.stop();
      this.server = null;
      console.log('Webhook server stopped');
    }
  }

  private verifyGitHubWebhook(payload: string, signature: string): boolean {
    const expectedSignature = createHmac('sha256', WEBHOOK_SECRET)
      .update(payload, 'utf8')
      .digest('hex');
    
    const computedSignature = `sha256=${expectedSignature}`;
    return signature === computedSignature;
  }
  
  private async handlePushEvent(payload: PushEvent) {}

  private async handleIssuesEvent(payload: IssuesEvent) {}

  private async handlePullRequestEvent(payload: PullRequestEvent) {
    const now = new Date();
    const hour = now.getHours();
    const channelId = await this.getChannelId(payload);
    if (!channelId) return;
    const channel = await this.client.channels.fetch(channelId);
    if (!(channel instanceof TextChannel)) return;
    if (payload.action === 'opened' || payload.action === 'reopened') {
      let aiSummary = false;
      let description = '';
      
      // 이벤트 기반으로 AI 요약 요청
      await new Promise<void>((resolve) => {
        const query = `다음 PR 내용을 핵심만 뽑아서 1수준 리스트로만 요약하는데, 연관된 이슈 번호는 명확하게 명시해줘. 만약 요약할 수 없으면 요약이 불가능하다고 해줘.\n\n${payload.pull_request.body}`;
        this.eventBus.publish<SummarizePrEvent>({
          type: 'SUMMARIZE_PR',
          content: query,
          callback: (summary, isAiSummary) => {
            if (summary) {
              description = summary;
              aiSummary = isAiSummary;
            } else {
              description = `${payload.pull_request.body}` || 'No description';
              aiSummary = false;
            }
            resolve();
          }
        });
      });
      if (hour >= 0 && hour <= 7) return;
      channel.send({
        embeds: [
          {
            timestamp: new Date(payload.pull_request.created_at).toISOString(),
            footer: {
              text: aiSummary ? '🤖 AI로 요약되었습니다' : '😵‍💫 AI로 요약할 수 없습니다',
            },
            author: {
              name: payload.pull_request.user.login,
              icon_url: payload.pull_request.user.avatar_url,
              url: payload.pull_request.user.html_url,
            },
            title: `PR ${payload.action}: ${payload.pull_request.title} (#${payload.pull_request.number})`,
            url: payload.pull_request.html_url,
            description: description,
            fields: [
              {
                name: '🏢 Organization',
                value: `${payload.organization?.login || '-'}`,
                inline: true
              },
              {
                name: '📦 Repository',
                value: `${payload.repository.name}`,
                inline: true
              },
              {
                name: '🌿 Branch',
                value: `base: \`${payload.pull_request.base.ref}\` ← compare: \`${payload.pull_request.head.ref}\``,
              },
            ],
            color: 0x0099ff,
          }
        ]
      });
    } else if (payload.action === 'closed') {
      if (hour >= 0 && hour <= 7) return;
      channel.send({
        embeds: [
          {
            timestamp: new Date(payload.pull_request.closed_at).toISOString(),
            author: {
              name: payload.pull_request.user.login,
              icon_url: payload.pull_request.user.avatar_url,
              url: payload.pull_request.user.html_url,
            },
            title: `PR ${payload.action}: ${payload.pull_request.title} (#${payload.pull_request.number})`,
            url: payload.pull_request.html_url,
            description: 'PR이 닫혔습니다. 고생하셨습니다! 👍👍',
            fields: [
              {
                name: '🏢 Organization',
                value: `${payload.organization?.login || '-'}`,
                inline: true
              },
              {
                name: '📦 Repository',
                value: `${payload.repository.name}`,
                inline: true
              },
              {
                name: '🌿 Branch',
                value: `base: \`${payload.pull_request.base.ref}\` ← compare: \`${payload.pull_request.head.ref}\``,
              },
            ],
            color: 0x0099ff,
          }
        ]
      });
    }
  }
  
  private handleGitHubWebhook(eventName: WebhookEventName, payload: WebhookEvent) {
    console.info(`Received GitHub webhook event: ${eventName}`);
    switch (eventName) {
      case 'push':
        this.handlePushEvent(payload as PushEvent);
        break;
  
      case 'pull_request':
        this.handlePullRequestEvent(payload as PullRequestEvent);
        break;
        
      case 'issues':
        this.handleIssuesEvent(payload as IssuesEvent);
        break;
        
      default:
        console.info(`Unhandled event: ${eventName}`);
    }
  }

  private async getChannelId(payload: PushEvent | PullRequestEvent | IssuesEvent) {
    const repoName = payload.repository.name;
    try {
      const entity = await db.select().from(githubWebhookChannelTable).where(eq(githubWebhookChannelTable.repoName, repoName)).get();
      if (!entity) return null;
      return entity.channelId;
    } catch (error) {
      console.error('Error getting channel ID:', error);
      return null;
    }
  }
}