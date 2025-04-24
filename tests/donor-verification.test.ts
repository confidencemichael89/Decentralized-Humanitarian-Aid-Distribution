import { describe, it, expect, beforeEach } from "vitest"

// Mock the Clarity contract environment
const mockTxSender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
const mockDonor = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"

// Mock contract state
let admin = mockTxSender
const verifiedDonors = new Map()
const donorDetails = new Map()

// Mock contract functions
const contractFunctions = {
  "is-admin": () => {
    return mockTxSender === admin
  },
  "add-verified-donor": (donor, name) => {
    if (mockTxSender !== admin) return { err: 1 }
    verifiedDonors.set(donor, true)
    donorDetails.set(donor, {
      name,
      "verification-date": 123, // Mock block height
      "donation-count": 0,
      "total-donated": 0,
    })
    return { ok: true }
  },
  "remove-verified-donor": (donor) => {
    if (mockTxSender !== admin) return { err: 1 }
    verifiedDonors.set(donor, false)
    return { ok: true }
  },
  "is-verified-donor": (donor) => {
    return verifiedDonors.get(donor) || false
  },
  "record-donation": (donor, amount) => {
    if (!verifiedDonors.get(donor)) return { err: 2 }
    const details = donorDetails.get(donor)
    donorDetails.set(donor, {
      ...details,
      "donation-count": details["donation-count"] + 1,
      "total-donated": details["total-donated"] + amount,
    })
    return { ok: true }
  },
  "get-donor-details": (donor) => {
    return donorDetails.get(donor)
  },
  "transfer-admin": (newAdmin) => {
    if (mockTxSender !== admin) return { err: 1 }
    admin = newAdmin
    return { ok: true }
  },
}

describe("Donor Verification Contract", () => {
  beforeEach(() => {
    // Reset state before each test
    admin = mockTxSender
    verifiedDonors.clear()
    donorDetails.clear()
  })
  
  it("should add a verified donor", () => {
    const result = contractFunctions["add-verified-donor"](mockDonor, "Test Donor")
    expect(result).toEqual({ ok: true })
    expect(contractFunctions["is-verified-donor"](mockDonor)).toBe(true)
    
    const details = contractFunctions["get-donor-details"](mockDonor)
    expect(details.name).toBe("Test Donor")
    expect(details["donation-count"]).toBe(0)
    expect(details["total-donated"]).toBe(0)
  })
  
  it("should remove a verified donor", () => {
    // First add the donor
    contractFunctions["add-verified-donor"](mockDonor, "Test Donor")
    
    // Then remove them
    const result = contractFunctions["remove-verified-donor"](mockDonor)
    expect(result).toEqual({ ok: true })
    expect(contractFunctions["is-verified-donor"](mockDonor)).toBe(false)
  })
  
  it("should record a donation for a verified donor", () => {
    // First add the donor
    contractFunctions["add-verified-donor"](mockDonor, "Test Donor")
    
    // Record a donation
    const result = contractFunctions["record-donation"](mockDonor, 100)
    expect(result).toEqual({ ok: true })
    
    // Check the updated details
    const details = contractFunctions["get-donor-details"](mockDonor)
    expect(details["donation-count"]).toBe(1)
    expect(details["total-donated"]).toBe(100)
  })
  
  it("should fail to record a donation for an unverified donor", () => {
    // Try to record a donation without verifying the donor first
    const result = contractFunctions["record-donation"](mockDonor, 100)
    expect(result).toEqual({ err: 2 })
  })
  
  it("should transfer admin rights", () => {
    const newAdmin = "ST3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    
    // Transfer admin rights
    const result = contractFunctions["transfer-admin"](newAdmin)
    expect(result).toEqual({ ok: true })
    
    // The old admin should no longer be able to add donors
    const addResult = contractFunctions["add-verified-donor"](mockDonor, "Test Donor")
    expect(addResult).toEqual({ err: 1 })
  })
})
