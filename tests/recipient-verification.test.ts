import { describe, it, expect, beforeEach } from "vitest"

// Mock the Clarity contract environment
const mockTxSender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
const mockRecipient = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"

// Mock contract state
let admin = mockTxSender
const verifiedRecipients = new Map()
const recipientDetails = new Map()

// Mock contract functions
const contractFunctions = {
  "is-admin": () => {
    return mockTxSender === admin
  },
  "add-verified-recipient": (recipient, name, location, needsCategory) => {
    if (mockTxSender !== admin) return { err: 1 }
    verifiedRecipients.set(recipient, true)
    recipientDetails.set(recipient, {
      name,
      location,
      "verification-date": 123, // Mock block height
      "needs-category": needsCategory,
      "aid-received-count": 0,
    })
    return { ok: true }
  },
  "remove-verified-recipient": (recipient) => {
    if (mockTxSender !== admin) return { err: 1 }
    verifiedRecipients.set(recipient, false)
    return { ok: true }
  },
  "is-verified-recipient": (recipient) => {
    return verifiedRecipients.get(recipient) || false
  },
  "record-aid-received": (recipient) => {
    if (!verifiedRecipients.get(recipient)) return { err: 2 }
    const details = recipientDetails.get(recipient)
    recipientDetails.set(recipient, {
      ...details,
      "aid-received-count": details["aid-received-count"] + 1,
    })
    return { ok: true }
  },
  "get-recipient-details": (recipient) => {
    return recipientDetails.get(recipient)
  },
  "transfer-admin": (newAdmin) => {
    if (mockTxSender !== admin) return { err: 1 }
    admin = newAdmin
    return { ok: true }
  },
}

describe("Recipient Verification Contract", () => {
  beforeEach(() => {
    // Reset state before each test
    admin = mockTxSender
    verifiedRecipients.clear()
    recipientDetails.clear()
  })
  
  it("should add a verified recipient", () => {
    const result = contractFunctions["add-verified-recipient"](mockRecipient, "Test Recipient", "Test Location", "Food")
    expect(result).toEqual({ ok: true })
    expect(contractFunctions["is-verified-recipient"](mockRecipient)).toBe(true)
    
    const details = contractFunctions["get-recipient-details"](mockRecipient)
    expect(details.name).toBe("Test Recipient")
    expect(details.location).toBe("Test Location")
    expect(details["needs-category"]).toBe("Food")
    expect(details["aid-received-count"]).toBe(0)
  })
  
  it("should remove a verified recipient", () => {
    // First add the recipient
    contractFunctions["add-verified-recipient"](mockRecipient, "Test Recipient", "Test Location", "Food")
    
    // Then remove them
    const result = contractFunctions["remove-verified-recipient"](mockRecipient)
    expect(result).toEqual({ ok: true })
    expect(contractFunctions["is-verified-recipient"](mockRecipient)).toBe(false)
  })
  
  it("should record aid received for a verified recipient", () => {
    // First add the recipient
    contractFunctions["add-verified-recipient"](mockRecipient, "Test Recipient", "Test Location", "Food")
    
    // Record aid received
    const result = contractFunctions["record-aid-received"](mockRecipient)
    expect(result).toEqual({ ok: true })
    
    // Check the updated details
    const details = contractFunctions["get-recipient-details"](mockRecipient)
    expect(details["aid-received-count"]).toBe(1)
  })
  
  it("should fail to record aid for an unverified recipient", () => {
    // Try to record aid without verifying the recipient first
    const result = contractFunctions["record-aid-received"](mockRecipient)
    expect(result).toEqual({ err: 2 })
  })
  
  it("should transfer admin rights", () => {
    const newAdmin = "ST3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    
    // Transfer admin rights
    const result = contractFunctions["transfer-admin"](newAdmin)
    expect(result).toEqual({ ok: true })
    
    // The old admin should no longer be able to add recipients
    const addResult = contractFunctions["add-verified-recipient"](
        mockRecipient,
        "Test Recipient",
        "Test Location",
        "Food",
    )
    expect(addResult).toEqual({ err: 1 })
  })
})
