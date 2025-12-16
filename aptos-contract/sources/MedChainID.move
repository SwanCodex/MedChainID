module medchain::MedChainID {
    use std::signer;
    use std::vector;
    use aptos_framework::event;
    use aptos_framework::account; // <--- ADD THIS IMPORT

    /// Error codes
    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_CONSUMED: u64 = 2;
    const E_TOKEN_NOT_FOUND: u64 = 3;
    const E_UNAUTHORIZED: u64 = 4;

    /// Represents a single Medical Token
    struct MedicalToken has key, store {
        token_id: u64,
        record_type: vector<u8>,
        document_hash: vector<u8>,
        ipfs_cid: vector<u8>,
        is_consumed: bool,
        issuer: address,
        timestamp: u64,
    }

    /// Storage for all tokens issued by an account
    struct TokenRegistry has key {
        tokens: vector<MedicalToken>,
        next_token_id: u64,
        mint_events: event::EventHandle<MintEvent>,
        consume_events: event::EventHandle<ConsumeEvent>,
    }

    struct MintEvent has drop, store {
        token_id: u64,
        issuer: address,
        timestamp: u64,
    }

    struct ConsumeEvent has drop, store {
        token_id: u64,
        consumer: address,
        timestamp: u64,
    }

    /// Initialize the registry for a new issuer
    public entry fun initialize(account: &signer) {
        let account_addr = signer::address_of(account);
        if (!exists<TokenRegistry>(account_addr)) {
            move_to(account, TokenRegistry {
                tokens: vector::empty<MedicalToken>(),
                next_token_id: 0,
                // FIX: Use account::new_event_handle instead of event::new_event_handle
                mint_events: account::new_event_handle<MintEvent>(account),
                consume_events: account::new_event_handle<ConsumeEvent>(account),
            });
        };
    }

    /// Mint a new medical token
    public entry fun mint_token(
        account: &signer,
        record_type: vector<u8>,
        document_hash: vector<u8>,
        ipfs_cid: vector<u8>,
    ) acquires TokenRegistry {
        let account_addr = signer::address_of(account);
        if (!exists<TokenRegistry>(account_addr)) {
            initialize(account);
        };

        let registry = borrow_global_mut<TokenRegistry>(account_addr);
        let token_id = registry.next_token_id;
        let timestamp = aptos_framework::timestamp::now_seconds();

        let token = MedicalToken {
            token_id,
            record_type,
            document_hash,
            ipfs_cid,
            is_consumed: false,
            issuer: account_addr,
            timestamp,
        };

        vector::push_back(&mut registry.tokens, token);
        registry.next_token_id = token_id + 1;
        
        event::emit_event(&mut registry.mint_events, MintEvent {
            token_id,
            issuer: account_addr,
            timestamp,
        });
    }

    /// Consume a token (mark as used)
    public entry fun consume_token(
        consumer: &signer,
        issuer_addr: address,
        token_id: u64,
    ) acquires TokenRegistry {
        assert!(exists<TokenRegistry>(issuer_addr), E_NOT_INITIALIZED);
        let registry = borrow_global_mut<TokenRegistry>(issuer_addr);
        let len = vector::length(&registry.tokens);
        let i = 0;
        let found = false;
        
        while (i < len) {
            let token = vector::borrow_mut(&mut registry.tokens, i);
            if (token.token_id == token_id) {
                assert!(!token.is_consumed, E_ALREADY_CONSUMED);
                token.is_consumed = true;
                found = true;
                break
            };
            i = i + 1;
        };

        assert!(found, E_TOKEN_NOT_FOUND);

        let timestamp = aptos_framework::timestamp::now_seconds();
        event::emit_event(&mut registry.consume_events, ConsumeEvent {
            token_id,
            consumer: signer::address_of(consumer),
            timestamp,
        });
    }

    // Note: Changed /// to // to fix documentation warnings
    // Verify if a token is valid (view function)
    #[view]
    public fun verify_token(issuer_addr: address, token_id: u64): (bool, address) acquires TokenRegistry {
        if (!exists<TokenRegistry>(issuer_addr)) {
            return (false, @0x0)
        };
        let registry = borrow_global<TokenRegistry>(issuer_addr);
        let len = vector::length(&registry.tokens);
        let i = 0;
        while (i < len) {
            let token = vector::borrow(&registry.tokens, i);
            if (token.token_id == token_id) {
                return (!token.is_consumed, token.issuer)
            };
            i = i + 1;
        };

        (false, @0x0)
    }

    // Get token details (view function)
    #[view]
    public fun get_token_details(
        issuer_addr: address,
        token_id: u64
    ): (vector<u8>, vector<u8>, vector<u8>, bool, address, u64) acquires TokenRegistry {
        assert!(exists<TokenRegistry>(issuer_addr), E_NOT_INITIALIZED);
        let registry = borrow_global<TokenRegistry>(issuer_addr);
        let len = vector::length(&registry.tokens);
        let i = 0;
        while (i < len) {
            let token = vector::borrow(&registry.tokens, i);
            if (token.token_id == token_id) {
                return (
                    token.record_type,
                    token.document_hash,
                    token.ipfs_cid,
                    token.is_consumed,
                    token.issuer,
                    token.timestamp
                )
            };
            i = i + 1;
        };

        abort E_TOKEN_NOT_FOUND
    }
}