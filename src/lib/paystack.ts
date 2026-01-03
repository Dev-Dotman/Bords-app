import axios from 'axios'

// Paystack API configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!
const PAYSTACK_BASE_URL = 'https://api.paystack.co'

const paystackClient = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
})

export interface InitializePaymentParams {
  email: string
  amount: number // in kobo (100 kobo = 1 NGN)
  reference: string
  callback_url?: string
  metadata?: Record<string, any>
  plan?: string
  channels?: string[]
}

export interface InitializePaymentResponse {
  status: boolean
  message: string
  data: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

export interface VerifyPaymentResponse {
  status: boolean
  message: string
  data: {
    id: number
    domain: string
    status: 'success' | 'failed' | 'abandoned'
    reference: string
    amount: number
    message: string | null
    gateway_response: string
    paid_at: string
    created_at: string
    channel: string
    currency: string
    ip_address: string
    metadata: Record<string, any>
    fees: number
    customer: {
      id: number
      first_name: string | null
      last_name: string | null
      email: string
      customer_code: string
      phone: string | null
      metadata: Record<string, any> | null
      risk_action: string
    }
    authorization: {
      authorization_code: string
      bin: string
      last4: string
      exp_month: string
      exp_year: string
      channel: string
      card_type: string
      bank: string
      country_code: string
      brand: string
      reusable: boolean
      signature: string
      account_name: string | null
    }
  }
}

/**
 * Initialize a payment transaction
 */
export async function initializePayment(
  params: InitializePaymentParams
): Promise<InitializePaymentResponse> {
  try {
    const response = await paystackClient.post<InitializePaymentResponse>(
      '/transaction/initialize',
      params
    )
    return response.data
  } catch (error: any) {
    console.error('Paystack initialize payment error:', error.response?.data || error.message)
    throw new Error(error.response?.data?.message || 'Failed to initialize payment')
  }
}

/**
 * Verify a payment transaction
 */
export async function verifyPayment(reference: string): Promise<VerifyPaymentResponse> {
  try {
    const response = await paystackClient.get<VerifyPaymentResponse>(
      `/transaction/verify/${reference}`
    )
    return response.data
  } catch (error: any) {
    console.error('Paystack verify payment error:', error.response?.data || error.message)
    throw new Error(error.response?.data?.message || 'Failed to verify payment')
  }
}

/**
 * Verify Paystack webhook signature
 */
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const crypto = require('crypto')
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(payload)
    .digest('hex')
  
  return hash === signature
}

/**
 * Generate a unique payment reference
 */
export function generatePaymentReference(userId: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  return `BORDS-${userId.substring(0, 8)}-${timestamp}-${random}`.toUpperCase()
}
