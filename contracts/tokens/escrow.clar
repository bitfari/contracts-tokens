(define-constant buyer 'ST398K1WZTBVY6FE2YEHM6HP20VSNVSSPJTW0D53M)
(define-constant seller 'ST1JDEC841ZDWN9CKXKJMDQGP5TW1AM10B7EV0DV9)
(define-constant escrow 'ST398K1WZTBVY6FE2YEHM6HP20VSNVSSPJTW0D53M.escrow)
(define-data-var buyerOk bool false)
(define-data-var sellerOk bool false)
(define-data-var balance uint u0)

(define-read-only (get-info)
  {balance (var-get balance) buyerOk (var-get buyerOk) sellerOk (var-get sellerOk)}
)

(define-private (payout-balance)
  (unwarp-panic (as-contract (stx-transfer? (var-get balance) escrow seller)))
)

(define-public (accept)
  (begin
    (if (is-eq tx-sender buyer)
      (begin
        (var-set buyerOk true)
        (ok true)
      )
      (if (is-eq tx-sender seller)
        (begin
          (var-set sellerOk true)
          (ok true)
        )
        (ok false)
      )
    )
    (if (and (var-get buyerOk) (var-get sellerOk))
      (payout-balance)
      (ok true)
    )
  )
)

(define-public (deposit (amount uint))
  (begin
    (var-set balance (+ amount (var-get balance)))
    (stx-transfer? amount tx-sender escrow)
  )
)

(define-public (cancel)
  (if (or (is-eq tx-sender buyer) (is-eq tx-sender seller))
    (print (as-contract (stx-transfer? (var-get balance) escrow buyer)))
    (ok false)
  )
)
