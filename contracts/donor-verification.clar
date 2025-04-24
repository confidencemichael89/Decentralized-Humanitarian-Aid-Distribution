;; Donor Verification Contract
;; Purpose: Validates legitimate funding sources

(define-data-var admin principal tx-sender)

;; Map to store verified donors
(define-map verified-donors principal bool)

;; Map to store donor details
(define-map donor-details principal
  {
    name: (string-ascii 100),
    verification-date: uint,
    donation-count: uint,
    total-donated: uint
  }
)

;; Check if caller is admin
(define-private (is-admin)
  (is-eq tx-sender (var-get admin))
)

;; Add a new verified donor (admin only)
(define-public (add-verified-donor (donor principal) (name (string-ascii 100)))
  (begin
    (asserts! (is-admin) (err u1))
    (map-set verified-donors donor true)
    (map-set donor-details donor {
      name: name,
      verification-date: block-height,
      donation-count: u0,
      total-donated: u0
    })
    (ok true)
  )
)

;; Remove a verified donor (admin only)
(define-public (remove-verified-donor (donor principal))
  (begin
    (asserts! (is-admin) (err u1))
    (map-set verified-donors donor false)
    (ok true)
  )
)

;; Check if a donor is verified
(define-read-only (is-verified-donor (donor principal))
  (default-to false (map-get? verified-donors donor))
)

;; Record a donation
(define-public (record-donation (donor principal) (amount uint))
  (let (
    (details (default-to {
      name: "",
      verification-date: u0,
      donation-count: u0,
      total-donated: u0
    } (map-get? donor-details donor)))
  )
    (asserts! (is-verified-donor donor) (err u2))
    (map-set donor-details donor {
      name: (get name details),
      verification-date: (get verification-date details),
      donation-count: (+ (get donation-count details) u1),
      total-donated: (+ (get total-donated details) amount)
    })
    (ok true)
  )
)

;; Get donor details
(define-read-only (get-donor-details (donor principal))
  (map-get? donor-details donor)
)

;; Transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-admin) (err u1))
    (var-set admin new-admin)
    (ok true)
  )
)
