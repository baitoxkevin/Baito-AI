/**
 * OpenRouter Service - Unit Tests
 *
 * Tests the OpenRouter service resilience including:
 * - Missing API key handling
 * - Error recovery
 * - API response validation
 *
 * Priority: P1 (High - Affects AI features)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenRouterService, MODELS } from '../../src/lib/openrouter-service';

describe('OpenRouterService', () => {

  // Clear global fetch before each test
  beforeEach(() => {
    delete (global as any).fetch;
  });

  // Reset all mocks after each test
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor and Initialization', () => {

    it('should create instance without API key and not throw', () => {
      // Just verify it doesn't throw during construction
      expect(() => new OpenRouterService('')).not.toThrow();
    });

    it('should create instance with API key successfully', () => {
      const service = new OpenRouterService('test-api-key');

      expect(service).toBeDefined();
    });

    it('should not throw error during instantiation without API key', () => {
      // This verifies the bug fix - should NOT throw
      expect(() => new OpenRouterService('')).not.toThrow();
    });
  });

  describe('Chat Method - Error Handling', () => {

    it('should throw descriptive error when API key is missing', async () => {
      // Clear any previous mocks
      vi.restoreAllMocks();

      const service = new OpenRouterService('');

      await expect(
        service.chat({
          model: MODELS.GEMINI_FLASH.id,
          messages: [{ role: 'user', content: 'Hello' }]
        })
      ).rejects.toThrow(/API key.*not configured/i);
    });

    it('should make API call when API key is provided', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'test-response',
          model: MODELS.GEMINI_FLASH.id,
          choices: [{
            message: {
              role: 'assistant',
              content: 'Hello! How can I help you today?'
            },
            finish_reason: 'stop'
          }],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30
          }
        })
      });

      const service = new OpenRouterService('test-api-key');

      const response = await service.chat({
        model: MODELS.GEMINI_FLASH.id,
        messages: [{ role: 'user', content: 'Hello' }]
      });

      expect(response).toBeDefined();
      expect(response.choices[0].message.content).toBe('Hello! How can I help you today?');
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle API error responses gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({
          error: {
            message: 'Invalid API key'
          }
        })
      });

      const service = new OpenRouterService('invalid-key');

      await expect(
        service.chat({
          model: MODELS.GEMINI_FLASH.id,
          messages: [{ role: 'user', content: 'Hello' }]
        })
      ).rejects.toThrow('Invalid API key');
    });

    it('should handle network errors gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const service = new OpenRouterService('test-api-key');

      await expect(
        service.chat({
          model: MODELS.GEMINI_FLASH.id,
          messages: [{ role: 'user', content: 'Hello' }]
        })
      ).rejects.toThrow('Network error');
    });
  });

  describe('Chat Stream Method - Error Handling', () => {

    it('should throw descriptive error when API key is missing', async () => {
      // Clear any previous mocks
      vi.restoreAllMocks();

      const service = new OpenRouterService('');

      const generator = service.chatStream({
        model: MODELS.GEMINI_FLASH.id,
        messages: [{ role: 'user', content: 'Hello' }]
      });

      // The error message should contain "API key" and "not configured"
      await expect(generator.next()).rejects.toThrow(/API key.*not configured/i);
    });

    it('should handle streaming errors gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Streaming error'));

      const service = new OpenRouterService('test-api-key');

      const generator = service.chatStream({
        model: MODELS.GEMINI_FLASH.id,
        messages: [{ role: 'user', content: 'Hello' }]
      });

      await expect(generator.next()).rejects.toThrow('Streaming error');
    });
  });

  describe('Get Models Method - Error Handling', () => {

    it('should return empty array when API key is missing', async () => {
      const service = new OpenRouterService('');

      const models = await service.getModels();

      // Should return empty array without throwing
      expect(models).toEqual([]);
    });

    it('should fetch models when API key is provided', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { id: 'model-1', name: 'Model 1' },
            { id: 'model-2', name: 'Model 2' }
          ]
        })
      });

      const service = new OpenRouterService('test-api-key');

      const models = await service.getModels();

      expect(models).toHaveLength(2);
      expect(models[0].id).toBe('model-1');
    });

    it('should return empty array on API error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      global.fetch = vi.fn().mockRejectedValue(new Error('API error'));

      const service = new OpenRouterService('test-api-key');

      const models = await service.getModels();

      expect(models).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Cost Estimation', () => {

    it('should calculate cost correctly', () => {
      const service = new OpenRouterService('test-api-key');

      const cost = service.estimateCost(
        1000,
        500,
        MODELS.GEMINI_FLASH.pricing
      );

      // 1000 prompt tokens * $0.075/1M = $0.000075
      // 500 completion tokens * $0.30/1M = $0.00015
      // Total = $0.000225
      expect(cost).toBeCloseTo(0.000225, 6);
    });

    it('should handle zero tokens', () => {
      const service = new OpenRouterService('test-api-key');

      const cost = service.estimateCost(
        0,
        0,
        MODELS.GEMINI_FLASH.pricing
      );

      expect(cost).toBe(0);
    });
  });

  describe('Request Headers', () => {

    it('should include correct headers in API requests', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'test',
          model: 'test-model',
          choices: [{ message: { role: 'assistant', content: 'test' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
        })
      } as Response);

      const service = new OpenRouterService('test-api-key');

      await service.chat({
        model: MODELS.GEMINI_FLASH.id,
        messages: [{ role: 'user', content: 'test' }]
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json',
            'HTTP-Referer': expect.any(String),
            'X-Title': 'Baito-AI'
          })
        })
      );

      fetchSpy.mockRestore();
    });
  });
});
