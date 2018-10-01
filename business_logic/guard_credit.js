const PRICE_PER_MINUTE = 50; // Shillings
const DURATION_PER_UNIT = 30; // Minutes
const PRICE_PER_UNIT = 1500;
module.exports = {
    calculate_credit: function (currentCredit, amount) {

        let totalMinutes = amount / PRICE_PER_MINUTE;
        let credit = (totalMinutes / DURATION_PER_UNIT).toFixed(1);
        return (Number(currentCredit) + Number(credit));
    },

    calculate_guard_spent_credit: function(totalCostOfGuarding){
        let spentCredit = totalCostOfGuarding / PRICE_PER_UNIT;
        return Number(spentCredit);
    }
};