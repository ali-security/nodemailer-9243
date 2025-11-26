'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const addressparser = require('../../lib/addressparser');

describe('#addressparser', () => {
    it('should handle single address correctly', () => {
        let input = 'andris@tr.ee';
        let expected = [
            {
                address: 'andris@tr.ee',
                name: ''
            }
        ];
        assert.deepStrictEqual(addressparser(input), expected);
    });

    it('should handle multiple addresses correctly', () => {
        let input = 'andris@tr.ee, andris@example.com';
        let expected = [
            {
                address: 'andris@tr.ee',
                name: ''
            },
            {
                address: 'andris@example.com',
                name: ''
            }
        ];
        assert.deepStrictEqual(addressparser(input), expected);
    });

    it('should handle unquoted name correctly', () => {
        let input = 'andris <andris@tr.ee>';
        let expected = [
            {
                name: 'andris',
                address: 'andris@tr.ee'
            }
        ];
        assert.deepStrictEqual(addressparser(input), expected);
    });

    it('should handle quoted name correctly', () => {
        let input = '"reinman, andris" <andris@tr.ee>';
        let expected = [
            {
                name: 'reinman, andris',
                address: 'andris@tr.ee'
            }
        ];
        assert.deepStrictEqual(addressparser(input), expected);
    });

    it('should handle quoted semicolons correctly', () => {
        let input = '"reinman; andris" <andris@tr.ee>';
        let expected = [
            {
                name: 'reinman; andris',
                address: 'andris@tr.ee'
            }
        ];
        assert.deepStrictEqual(addressparser(input), expected);
    });

    it('should handle unquoted name, unquoted address correctly', () => {
        let input = 'andris andris@tr.ee';
        let expected = [
            {
                name: 'andris',
                address: 'andris@tr.ee'
            }
        ];
        assert.deepStrictEqual(addressparser(input), expected);
    });

    it('should handle emtpy group correctly', () => {
        let input = 'Undisclosed:;';
        let expected = [
            {
                name: 'Undisclosed',
                group: []
            }
        ];
        assert.deepStrictEqual(addressparser(input), expected);
    });

    it('should handle address group correctly', () => {
        let input = 'Disclosed:andris@tr.ee, andris@example.com;';
        let expected = [
            {
                name: 'Disclosed',
                group: [
                    {
                        address: 'andris@tr.ee',
                        name: ''
                    },
                    {
                        address: 'andris@example.com',
                        name: ''
                    }
                ]
            }
        ];
        assert.deepStrictEqual(addressparser(input), expected);
    });

    it('should handle semicolon as a delimiter', () => {
        let input = 'andris@tr.ee; andris@example.com;';
        let expected = [
            {
                address: 'andris@tr.ee',
                name: ''
            },
            {
                address: 'andris@example.com',
                name: ''
            }
        ];
        assert.deepStrictEqual(addressparser(input), expected);
    });

    it('should handle mixed group correctly', () => {
        let input = 'Test User <test.user@mail.ee>, Disclosed:andris@tr.ee, andris@example.com;,,,, Undisclosed:;';
        let expected = [
            {
                address: 'test.user@mail.ee',
                name: 'Test User'
            },
            {
                name: 'Disclosed',
                group: [
                    {
                        address: 'andris@tr.ee',
                        name: ''
                    },
                    {
                        address: 'andris@example.com',
                        name: ''
                    }
                ]
            },
            {
                name: 'Undisclosed',
                group: []
            }
        ];
        assert.deepStrictEqual(addressparser(input), expected);
    });

    it('should flatten mixed group correctly', () => {
        let input = 'Test User <test.user@mail.ee>, Disclosed:andris@tr.ee, andris@example.com;,,,, Undisclosed:; bob@example.com BOB;';
        let expected = [
            {
                address: 'test.user@mail.ee',
                name: 'Test User'
            },

            {
                address: 'andris@tr.ee',
                name: ''
            },
            {
                address: 'andris@example.com',
                name: ''
            },
            {
                address: 'bob@example.com',
                name: 'BOB'
            }
        ];
        assert.deepStrictEqual(addressparser(input, { flatten: true }), expected);
    });

    it('semicolon as delimiter should not break group parsing', () => {
        let input = 'Test User <test.user@mail.ee>; Disclosed:andris@tr.ee, andris@example.com;,,,, Undisclosed:; bob@example.com;';
        let expected = [
            {
                address: 'test.user@mail.ee',
                name: 'Test User'
            },
            {
                name: 'Disclosed',
                group: [
                    {
                        address: 'andris@tr.ee',
                        name: ''
                    },
                    {
                        address: 'andris@example.com',
                        name: ''
                    }
                ]
            },
            {
                name: 'Undisclosed',
                group: []
            },
            {
                address: 'bob@example.com',
                name: ''
            }
        ];
        assert.deepStrictEqual(addressparser(input), expected);
    });

    it('should handle name from comment correctly', () => {
        let input = 'andris@tr.ee (andris)';
        let expected = [
            {
                name: 'andris',
                address: 'andris@tr.ee'
            }
        ];
        assert.deepStrictEqual(addressparser(input), expected);
    });

    it('should handle skip comment correctly', () => {
        let input = 'andris@tr.ee (reinman) andris';
        let expected = [
            {
                name: 'andris',
                address: 'andris@tr.ee'
            }
        ];
        assert.deepStrictEqual(addressparser(input), expected);
    });

    it('should handle missing address correctly', () => {
        let input = 'andris';
        let expected = [
            {
                name: 'andris',
                address: ''
            }
        ];
        assert.deepStrictEqual(addressparser(input), expected);
    });

    it('should handle apostrophe in name correctly', () => {
        let input = 'O\x27Neill';
        let expected = [
            {
                name: 'O\x27Neill',
                address: ''
            }
        ];
        assert.deepStrictEqual(addressparser(input), expected);
    });

    it('should handle particularily bad input, unescaped colon correctly', () => {
        let input = 'FirstName Surname-WithADash :: Company <firstname@company.com>';
        // Nested groups are not allowed per RFC 5322, so they should be flattened
        let expected = [
            {
                name: 'FirstName Surname-WithADash',
                group: [
                    {
                        address: 'firstname@company.com',
                        name: 'Company'
                    }
                ]
            }
        ];
        assert.deepStrictEqual(addressparser(input), expected);
    });

    // should not change an invalid email to valid email
    it('should handle invalid email address correctly', () => {
        let input = 'name@address.com@address2.com';
        let expected = [
            {
                name: '',
                address: 'name@address.com@address2.com'
            }
        ];
        assert.deepStrictEqual(addressparser(input), expected);
    });

    it('should handle unexpected <', () => {
        let input = 'reinman > andris < test <andris@tr.ee>';
        let expected = [
            {
                name: 'reinman > andris',
                address: 'andris@tr.ee'
            }
        ];
        assert.deepStrictEqual(addressparser(input), expected);
    });

    it('should handle escapes', () => {
        let input = '"Firstname \\" \\\\\\, Lastname \\(Test\\)" test@example.com';
        let expected = [{ address: 'test@example.com', name: 'Firstname " \\, Lastname (Test)' }];
        assert.deepStrictEqual(addressparser(input), expected);
    });

    it('should handle quoted usernames', () => {
        let input = '"test@subdomain.com"@example.com';
        let expected = [
            {
                address: 'test@subdomain.com@example.com',
                name: ''
            }
        ];
        assert.deepStrictEqual(addressparser(input), expected);
    });

    // DoS protection tests for deeply nested groups (CVE-like vulnerability fix)
    describe('Nested group DoS protection', () => {
        /**
         * Helper to build deeply nested group structure
         * e.g., depth=3 produces: "g0: g1: g2: user@example.com;"
         */
        function buildDeepGroup(depth) {
            let parts = [];
            for (let i = 0; i < depth; i++) {
                parts.push(`g${i}:`);
            }
            return parts.join(' ') + ' user@example.com;';
        }

        it('should handle moderately nested groups (depth 10)', () => {
            let input = buildDeepGroup(10);
            let result = addressparser(input);
            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].name, 'g0');
            assert.ok(result[0].group);
            // Should successfully extract the email from nested structure
            assert.strictEqual(result[0].group.length, 1);
            assert.strictEqual(result[0].group[0].address, 'user@example.com');
        });

        it('should handle nested groups at depth limit (depth 50)', () => {
            let input = buildDeepGroup(50);
            let result = addressparser(input);
            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].name, 'g0');
            assert.ok(result[0].group);
            // At the limit, should still work
            assert.strictEqual(result[0].group.length, 1);
            assert.strictEqual(result[0].group[0].address, 'user@example.com');
        });

        it('should safely truncate groups exceeding depth limit (depth 100)', () => {
            let input = buildDeepGroup(100);
            let result = addressparser(input);
            // Should not throw stack overflow
            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].name, 'g0');
            assert.ok(result[0].group);
            // Group is truncated due to depth limit - members beyond limit are dropped
        });

        it('should not crash with malicious deeply nested input (depth 3000)', () => {
            // This would previously cause "Maximum call stack size exceeded"
            let input = buildDeepGroup(3000);
            let start = Date.now();
            let result;

            // Must not throw
            assert.doesNotThrow(() => {
                result = addressparser(input);
            });

            let elapsed = Date.now() - start;
            // Should complete quickly (under 1 second), not hang
            assert.ok(elapsed < 1000, `Parser took too long: ${elapsed}ms`);

            // Should return a valid result structure
            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].name, 'g0');
            assert.ok(result[0].group);
        });

        it('should not crash with extreme nesting depth (depth 10000)', () => {
            let input = buildDeepGroup(10000);
            let start = Date.now();
            let result;

            assert.doesNotThrow(() => {
                result = addressparser(input);
            });

            let elapsed = Date.now() - start;
            assert.ok(elapsed < 2000, `Parser took too long: ${elapsed}ms`);
            assert.ok(Array.isArray(result));
        });

        it('should handle multiple deeply nested groups in same input', () => {
            let input = buildDeepGroup(100) + ', ' + buildDeepGroup(100);
            let result;

            assert.doesNotThrow(() => {
                result = addressparser(input);
            });

            // Should parse both groups
            assert.strictEqual(result.length, 2);
            assert.strictEqual(result[0].name, 'g0');
            assert.strictEqual(result[1].name, 'g0');
        });

        it('should handle mixed normal and deeply nested addresses', () => {
            let input = 'normal@example.com, ' + buildDeepGroup(200) + ', another@test.com';
            let result;

            assert.doesNotThrow(() => {
                result = addressparser(input);
            });

            assert.strictEqual(result.length, 3);
            assert.strictEqual(result[0].address, 'normal@example.com');
            assert.strictEqual(result[1].name, 'g0');
            assert.strictEqual(result[2].address, 'another@test.com');
        });

        it('should preserve normal functionality while protecting against DoS', () => {
            // Normal nested groups (allowed up to depth limit) should work correctly
            let input = 'Outer: Inner: deep@example.com; ;';
            let result = addressparser(input);

            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].name, 'Outer');
            assert.ok(result[0].group);
            // Inner group should be flattened
            assert.strictEqual(result[0].group.length, 1);
            assert.strictEqual(result[0].group[0].address, 'deep@example.com');
        });

        it('should work correctly with flatten option on deeply nested input', () => {
            let input = buildDeepGroup(100);
            let result;

            assert.doesNotThrow(() => {
                result = addressparser(input, { flatten: true });
            });

            // Should return flattened array without crashing
            assert.ok(Array.isArray(result));
        });
    });
});
