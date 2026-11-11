import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ALLOWED_ACTIONS,
  buildSystemPrompt,
  parseAiOutput,
  generateAssistanceReply,
  isAiConfigured,
} from '../src/ai.js';
import { readConfig } from '../src/config.js';

test('AI assistant prompt builder and output sanitization', async (t) => {
  await t.test('detects whether AI is configured', () => {
    const unconfigured = readConfig({
      NODE_ENV: 'test',
      AUTH_SECRET: '0'.repeat(32),
      RECORD_ENCRYPTION_KEY: 'a'.repeat(64),
    });
    assert.equal(isAiConfigured(unconfigured), false);

    const configuredGemini = readConfig({
      NODE_ENV: 'test',
      AUTH_SECRET: '0'.repeat(32),
      RECORD_ENCRYPTION_KEY: 'a'.repeat(64),
      GEMINI_API_KEY: 'test-gemini-key',
    });
    assert.equal(isAiConfigured(configuredGemini), true);

    const configuredOpenAI = readConfig({
      NODE_ENV: 'test',
      AUTH_SECRET: '0'.repeat(32),
      RECORD_ENCRYPTION_KEY: 'a'.repeat(64),
      OPENAI_API_KEY: 'test-openai-key',
    });
    assert.equal(isAiConfigured(configuredOpenAI), true);
  });

  await t.test('builds strict system prompt with patient ground truth and medical disclaimer rules', () => {
    const promptNoRequests = buildSystemPrompt([]);
    assert.match(promptNoRequests, /RuralCare Assist/);
    assert.match(promptNoRequests, /NO active or past ambulance requests/);
    assert.match(promptNoRequests, /CRITICAL EMERGENCY RULES/);
    assert.match(promptNoRequests, /dial 112/);
    assert.match(promptNoRequests, /NO MEDICAL DIAGNOSIS/);
    assert.match(promptNoRequests, /NO DISPATCH HALLUCINATION/);

    const promptWithRequests = buildSystemPrompt([
      {
        id: '12345678-aaaa-bbbb-cccc-111122223333',
        status: 'acknowledged',
        createdAt: '2026-10-09T00:00:00Z',
        pickupAddress: 'Village Health Post 4',
      },
    ]);
    assert.match(promptWithRequests, /12345678/);
    assert.match(promptWithRequests, /acknowledged/);
    assert.match(promptWithRequests, /Village Health Post 4/);
  });

  await t.test('parses clean and markdown-wrapped JSON outputs correctly', () => {
    const jsonStandard = JSON.stringify({
      reply: 'For emergencies call 112 immediately.',
      actionId: 'call_112',
    });
    const result1 = parseAiOutput(jsonStandard);
    assert.equal(result1.reply, 'For emergencies call 112 immediately.');
    assert.equal(result1.actionId, 'call_112');

    const markdownWrapped = `\`\`\`json
{
  "reply": "Please use the request form on this screen.",
  "actionId": "open_form"
}
\`\`\``;
    const result2 = parseAiOutput(markdownWrapped);
    assert.equal(result2.reply, 'Please use the request form on this screen.');
    assert.equal(result2.actionId, 'open_form');
  });

  await t.test('sanitizes unknown action IDs against the allowlist', () => {
    const invalidAction = JSON.stringify({
      reply: 'Looking for status.',
      actionId: 'invalid_dispatch_action',
    });
    const result = parseAiOutput(invalidAction);
    assert.equal(result.reply, 'Looking for status.');
    assert.equal(result.actionId, undefined);

    for (const valid of ALLOWED_ACTIONS) {
      const parsed = parseAiOutput(JSON.stringify({ reply: 'Test', actionId: valid }));
      assert.equal(parsed.actionId, valid);
    }
  });

  await t.test('throws 503 AI_NOT_CONFIGURED when keys are missing', async () => {
    const config = readConfig({
      NODE_ENV: 'test',
      AUTH_SECRET: '0'.repeat(32),
      RECORD_ENCRYPTION_KEY: 'a'.repeat(64),
    });

    await assert.rejects(
      () => generateAssistanceReply(config, { message: 'How to book ambulance?', history: [] }),
      (err: any) => err.status === 503 && err.code === 'AI_NOT_CONFIGURED'
    );
  });
});

