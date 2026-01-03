import mongoose from 'mongoose'
import Plan from '@/models/Plan'
import connectDB from '@/lib/mongodb'

const plans = [
  {
    name: 'Free',
    slug: 'free',
    description: 'Perfect for getting started with visual productivity',
    price: 0,
    currency: 'NGN',
    interval: 'monthly',
    features: [
      'Up to 3 boards',
      'Up to 50 tasks per board',
      'Basic sticky notes',
      'Task management',
      'Mobile responsive',
    ],
    maxBoards: 3,
    maxTasksPerBoard: 50,
    maxCollaborators: 0,
    hasAdvancedFeatures: false,
    isActive: true,
  },
  {
    name: 'Pro',
    slug: 'pro',
    description: 'For individuals who need more power and flexibility',
    price: 5000,
    currency: 'NGN',
    interval: 'monthly',
    features: [
      'Unlimited boards',
      'Unlimited tasks',
      'Advanced connections',
      'Priority support',
      'Export capabilities',
      'Custom themes',
      'Up to 5 collaborators',
    ],
    maxBoards: -1, // Unlimited
    maxTasksPerBoard: -1, // Unlimited
    maxCollaborators: 5,
    hasAdvancedFeatures: true,
    isActive: true,
  },
  {
    name: 'Pro Yearly',
    slug: 'pro-yearly',
    description: 'Pro plan billed annually - Save 20%',
    price: 48000, // 20% discount from 60000
    currency: 'NGN',
    interval: 'yearly',
    features: [
      'Unlimited boards',
      'Unlimited tasks',
      'Advanced connections',
      'Priority support',
      'Export capabilities',
      'Custom themes',
      'Up to 5 collaborators',
      '2 months free',
    ],
    maxBoards: -1,
    maxTasksPerBoard: -1,
    maxCollaborators: 5,
    hasAdvancedFeatures: true,
    isActive: true,
  },
  {
    name: 'Team',
    slug: 'team',
    description: 'For teams that collaborate on projects',
    price: 15000,
    currency: 'NGN',
    interval: 'monthly',
    features: [
      'Everything in Pro',
      'Unlimited collaborators',
      'Team workspaces',
      'Advanced permissions',
      'Real-time collaboration',
      'Team analytics',
      'Dedicated support',
    ],
    maxBoards: -1,
    maxTasksPerBoard: -1,
    maxCollaborators: -1, // Unlimited
    hasAdvancedFeatures: true,
    isActive: true,
  },
  {
    name: 'Team Yearly',
    slug: 'team-yearly',
    description: 'Team plan billed annually - Save 20%',
    price: 144000, // 20% discount from 180000
    currency: 'NGN',
    interval: 'yearly',
    features: [
      'Everything in Pro',
      'Unlimited collaborators',
      'Team workspaces',
      'Advanced permissions',
      'Real-time collaboration',
      'Team analytics',
      'Dedicated support',
      '2 months free',
    ],
    maxBoards: -1,
    maxTasksPerBoard: -1,
    maxCollaborators: -1,
    hasAdvancedFeatures: true,
    isActive: true,
  },
]

async function seedPlans() {
  try {
    console.log('Connecting to database...')
    await connectDB()

    console.log('Clearing existing plans...')
    await Plan.deleteMany({})

    console.log('Creating plans...')
    const createdPlans = await Plan.insertMany(plans)

    console.log(`✅ Successfully created ${createdPlans.length} plans:`)
    createdPlans.forEach((plan) => {
      console.log(`  - ${plan.name} (${plan.slug}): ${plan.currency} ${plan.price}/${plan.interval}`)
    })

    console.log('\n✅ Database seeded successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

seedPlans()
