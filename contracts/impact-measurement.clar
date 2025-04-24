;; Impact Measurement Contract
;; Purpose: Records outcomes of interventions

(define-data-var admin principal tx-sender)

;; Map to store impact records
(define-map impact-records uint
  {
    allocation-id: uint,
    recipient: principal,
    aid-type: uint,
    amount: uint,
    impact-date: uint,
    category: (string-ascii 50),
    description: (string-ascii 200),
    verified: bool
  }
)

;; Counter for impact record IDs
(define-data-var impact-id-counter uint u0)

;; Check if caller is admin
(define-private (is-admin)
  (is-eq tx-sender (var-get admin))
)

;; Helper function to get category from aid type
(define-private (get-category-from-aid-type (aid-type uint))
  (if (is-eq aid-type u1)
    "Food Security"
    (if (is-eq aid-type u2)
      "Healthcare"
      (if (is-eq aid-type u3)
        "Shelter"
        (if (is-eq aid-type u4)
          "Education"
          (if (is-eq aid-type u5)
            "Financial Support"
            "Other"
          )
        )
      )
    )
  )
)

;; Record impact
(define-public (record-impact
    (allocation-id uint)
    (recipient principal)
    (aid-type uint)
    (amount uint))
  (let (
    (new-id (+ (var-get impact-id-counter) u1))
    (category (get-category-from-aid-type aid-type))
  )
    ;; Create impact record
    (map-set impact-records new-id {
      allocation-id: allocation-id,
      recipient: recipient,
      aid-type: aid-type,
      amount: amount,
      impact-date: block-height,
      category: category,
      description: "",
      verified: false
    })

    ;; Increment the counter
    (var-set impact-id-counter new-id)

    (ok new-id)
  )
)

;; Verify impact (admin only)
(define-public (verify-impact
    (impact-id uint)
    (description (string-ascii 200)))
  (let (
    (impact (default-to {
      allocation-id: u0,
      recipient: tx-sender,
      aid-type: u0,
      amount: u0,
      impact-date: u0,
      category: "",
      description: "",
      verified: false
    } (map-get? impact-records impact-id)))
  )
    (asserts! (is-admin) (err u1))

    (map-set impact-records impact-id {
      allocation-id: (get allocation-id impact),
      recipient: (get recipient impact),
      aid-type: (get aid-type impact),
      amount: (get amount impact),
      impact-date: (get impact-date impact),
      category: (get category impact),
      description: description,
      verified: true
    })

    (ok true)
  )
)

;; Get impact record details
(define-read-only (get-impact-details (impact-id uint))
  (map-get? impact-records impact-id)
)

;; Transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-admin) (err u1))
    (var-set admin new-admin)
    (ok true)
  )
)
