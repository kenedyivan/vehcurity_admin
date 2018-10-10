let assert = require('assert');
let cashPayment = require('../business_logic/pay_guard_from_cash');
let creditPayment = require('../business_logic/pay_guard_from_credit');
let credit = require('../business_logic/guard_credit');
let ownerCredit = require('../business_logic/owner_credit');
describe('Array', function () {
    describe('#indexOf()', function () {
        it('should return -1 when the value is not present', function () {
            assert.equal([1, 2, 3].indexOf(4), -1);
        });
    });
});

describe('New Guard Credit ', function () {
    it('should return 9 when 5 is subtracted', function () {
        assert.equal(9, cashPayment.newGuardCredit(14, 5));
    });
});

describe('New Spent Credit', function () {
    it('should return 19 when 5 is added', function () {
        assert.equal(19, cashPayment.newSpentCredit(14, 5));
    });
});

describe('Calculated spent Credit', function () {
    it('should return 2 when 3000 shillings is spent', function () {
        assert.equal(2, credit.calculate_guard_spent_credit(3000));
    });
});

describe('New Owner Credit', function () {
    it('should return 12 when 5 is subtracted', function () {
        assert.equal(12, creditPayment.calculateNewOwnerCredit(17, 5));
    });
});

describe('New Guard Spent Credit', function () {
    it('should return 19 when 5 is added', function () {
        assert.equal(19, creditPayment.calculateNewGuardSpentCredit(14, 5));
    });
});

describe('New Guard spent Credit', function () {
    it('should return 2 when 3000 shillings is spent', function () {
        assert.equal(2, ownerCredit.calculate_owner_spent_credit(3000));
    });
});
