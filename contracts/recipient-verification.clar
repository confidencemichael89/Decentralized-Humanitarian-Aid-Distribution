;; Recipient Verification Contract
;; Purpose: Manages beneficiary identities

(define-data-var admin principal tx-sender)

;; Map to store verified recipients
(define-map verified-recipients principal bool)

;; Map to store recipient details
(define-map recipient-details principal
  {
    name: (string-ascii 100),
    location: (string-ascii 100),
    verification-date: uint,
    needs-category: (string-ascii 50),
    aid-received-count: uint
  }
)

;; Check if caller is admin
(define-private (is-admin)
  (is-eq tx-sender (var-get admin))
)

;; Add a new verified recipient (admin only)
(define-public (add-verified-recipient
    (recipient principal)
    (name (string-ascii 100))
    (location (string-ascii 100))
    (needs-category (string-ascii 50)))
  (begin
    (asserts! (is-admin) (err u1))
    (map-set verified-recipients recipient true)
    (map-set recipient-details recipient {
      name: name,
      location: location,
      verification-date: block-height,
      needs-category: needs-category,
      aid-received-count: u0
    })
    (ok true)
  )
)

;; Remove a verified recipient (admin only)
(define-public (remove-verified-recipient (recipient principal))
  (begin
    (asserts! (is-admin) (err u1))
    (map-set verified-recipients recipient false)
    (ok true)
  )
)

;; Check if a recipient is verified
(define-read-only (is-verified-recipient (recipient principal))
  (default-to false (map-get? verified-recipients recipient))
)

;; Record aid received
(define-public (record-aid-received (recipient principal))
  (let (
    (details (default-to {
      name: "",
      location: "",
      verification-date: u0,
      needs-category: "",
      aid-received-count: u0
    } (map-get? recipient-details recipient)))
  )
    (asserts! (is-verified-recipient recipient) (err u2))
    (map-set recipient-details recipient {
      name: (get name details),
      location: (get location details),
      verification-date: (get verification-date details),
      needs-category: (get needs-category details),
      aid-received-count: (+ (get aid-received-count details) u1)
    })
    (ok true)
  )
)

;; Get recipient details
(define-read-only (get-recipient-details (recipient principal))
  (map-get? recipient-details recipient)
)

;; Transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-admin) (err u1))
    (var-set admin new-admin)
    (ok true)
  )
)
