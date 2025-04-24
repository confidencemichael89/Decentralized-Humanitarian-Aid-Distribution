import { describe, it, expect, beforeEach } from "vitest"

// Mock the Clarity contract environment
const mockTxSender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
const mockRecipient = "ST3CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"

// Mock contract state
let admin = mockTxSender
const impactRecords = new Map()
let impactIdCounter = 0

// Mock contract functions
const contractFunctions = {
  "is-admin": () => {
    return mockTxSender === admin
  },
  "record-impact": (allocationId, recipient, aidType, amount) => {
    // Create new impact ID
    const newId = ++impactIdCounter
    
    // Get category from aid type
    let category
    switch (aidType) {
      case 1:
        category = "Food Security"
        break
      case 2:
        category = "Healthcare"
        break
      case 3:
        category = "Shelter"
        break
      case 4:
        category = "Education"
        break
      case 5:
        category = "Financial Support"
        break
      default:
        category = "Other"
    }
    
    // Create impact record
    impactRecords.set(newId, {
      "allocation-id": allocationId,
      recipient,
      "aid-type": aidType,
      amount,
      "impact-date": 123, // Mock block height
      category,
      description: "",
      verified: false,
    })
    
    return { ok: newId }
  },
  "verify-impact": (impactId, description) => {
    if (mockTxSender !== admin) return { err: 1 }
    
    const impact = impactRecords.get(impactId)
    if (!impact) return { err: 2 }
    
    // Update impact details
    impactRecords.set(impactId, {
      ...impact,
      description,
      verified: true,
    })
    
    return { ok: true }
  },
  "get-impact-details": (impactId) => {
    return impactRecords.get(impactId)
  },
  "get-total-impact-by-category": (category) => {
    let total = 0
    
    // Sum up all verified impacts in the category
    impactRecords.forEach((impact) => {
      if (impact.category === category && impact.verified) {
        total += impact.amount
      }
    })
    
    return { category, total }
  },
  "transfer-admin": (newAdmin) => {
    if (mockTxSender !== admin) return { err: 1 }
    admin = newAdmin
    return { ok: true }
  },
}

describe("Impact Measurement Contract", () => {
  beforeEach(() => {
    // Reset state before each test
    admin = mockTxSender
    impactRecords.clear()
    impactIdCounter = 0
  })
  
  it("should record impact successfully", () => {
    const result = contractFunctions["record-impact"](
        1, // Allocation ID
        mockRecipient,
        1, // Food aid type
        100, // Amount
    )
    
    expect(result.ok).toBeDefined()
    expect(result.ok).toBe(1) // First impact ID
    
    const impact = contractFunctions["get-impact-details"](1)
    expect(impact).toBeDefined()
    expect(impact["allocation-id"]).toBe(1)
    expect(impact.recipient).toBe(mockRecipient)
    expect(impact["aid-type"]).toBe(1)
    expect(impact.amount).toBe(100)
    expect(impact.category).toBe("Food Security")
    expect(impact.verified).toBe(false)
  })
  
  it("should verify impact", () => {
    // First create an impact record
    contractFunctions["record-impact"](1, mockRecipient, 1, 100)
    
    // Verify impact
    const result = contractFunctions["verify-impact"](1, "Provided food to 20 families for one week")
    
    expect(result).toEqual({ ok: true })
    
    const impact = contractFunctions["get-impact-details"](1)
    expect(impact.description).toBe("Provided food to 20 families for one week")
    expect(impact.verified).toBe(true)
  })
  
  it("should calculate total impact by category", () => {
    // Create multiple impact records
    contractFunctions["record-impact"](1, mockRecipient, 1, 100) // Food
    contractFunctions["record-impact"](2, mockRecipient, 1, 200) // Food
    contractFunctions["record-impact"](3, mockRecipient, 2, 300) // Healthcare
    
    // Verify some impacts
    contractFunctions["verify-impact"](1, "Impact 1")
    contractFunctions["verify-impact"](3, "Impact 3")
    
    // Calculate total for Food Security
    const foodResult = contractFunctions["get-total-impact-by-category"]("Food Security")
    expect(foodResult.total).toBe(100) // Only impact 1 is verified
    
    // Calculate total for Healthcare
    const healthResult = contractFunctions["get-total-impact-by-category"]("Healthcare")
    expect(healthResult.total).toBe(300) // Impact 3 is verified
  })
  
  it("should fail to verify impact if not admin", () => {
    // First create an impact record
    contractFunctions["record-impact"](1, mockRecipient, 1, 100)
    
    // Change admin
    admin = "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    
    // Try to verify impact
    const result = contractFunctions["verify-impact"](1, "Provided food to 20 families for one week")
    
    expect(result.err).toBeDefined()
    expect(result.err).toBe(1)
  })
})
