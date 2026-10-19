// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract BudgetVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct BudgetCategory {
        uint256 id;
        string name;
        uint256 limit;
        uint256 spent;
        bool active;
    }

    struct SavingsGoal {
        uint256 id;
        string name;
        uint256 target;
        uint256 saved;
        bool completed;
    }

    IERC20 public immutable usdc;

    mapping(address => uint256) public vaultBalance;
    mapping(address => mapping(uint256 => BudgetCategory)) public budgets;
    mapping(address => mapping(uint256 => SavingsGoal)) public savingsGoals;

    mapping(address => uint256) private _categoryCount;
    mapping(address => uint256) private _goalCount;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event EmergencyWithdrawn(address indexed user, uint256 vaultAmount, uint256 goalAmount, uint256 total);
    event CategoryCreated(address indexed user, uint256 indexed categoryId, string name, uint256 limit);
    event GoalCreated(address indexed user, uint256 indexed goalId, string name, uint256 target);
    event GoalFunded(address indexed user, uint256 indexed goalId, uint256 amount, uint256 totalSaved, bool completed);
    event GoalWithdrawn(address indexed user, uint256 indexed goalId, uint256 amount);
    event Spent(address indexed user, address indexed recipient, uint256 indexed categoryId, uint256 amount);

    error ZeroAddress();
    error ZeroAmount();
    error ZeroReceived();
    error InsufficientVaultBalance();
    error InvalidCategory();
    error CategoryInactive();
    error CategoryLimitExceeded();
    error InvalidGoal();
    error InsufficientGoalBalance();

    constructor(address usdc_) Ownable(msg.sender) {
        if (usdc_ == address(0)) revert ZeroAddress();
        usdc = IERC20(usdc_);
    }

    function deposit(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();

        uint256 beforeBalance = usdc.balanceOf(address(this));
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        uint256 received = usdc.balanceOf(address(this)) - beforeBalance;
        if (received < 1) revert ZeroReceived();

        vaultBalance[msg.sender] += received;

        emit Deposited(msg.sender, received);
    }

    function withdraw(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (vaultBalance[msg.sender] < amount) revert InsufficientVaultBalance();

        vaultBalance[msg.sender] -= amount;
        usdc.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    function createCategory(string calldata name, uint256 limit) external nonReentrant returns (uint256 categoryId) {
        categoryId = _categoryCount[msg.sender] + 1;
        _categoryCount[msg.sender] = categoryId;

        budgets[msg.sender][categoryId] = BudgetCategory({
            id: categoryId,
            name: name,
            limit: limit,
            spent: 0,
            active: true
        });

        emit CategoryCreated(msg.sender, categoryId, name, limit);
    }

    function createGoal(string calldata name, uint256 target) external nonReentrant returns (uint256 goalId) {
        if (target == 0) revert ZeroAmount();

        goalId = _goalCount[msg.sender] + 1;
        _goalCount[msg.sender] = goalId;

        savingsGoals[msg.sender][goalId] = SavingsGoal({
            id: goalId,
            name: name,
            target: target,
            saved: 0,
            completed: false
        });

        emit GoalCreated(msg.sender, goalId, name, target);
    }

    function fundGoal(uint256 goalId, uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (vaultBalance[msg.sender] < amount) revert InsufficientVaultBalance();

        SavingsGoal storage goal = savingsGoals[msg.sender][goalId];
        if (goal.id == 0) revert InvalidGoal();

        vaultBalance[msg.sender] -= amount;
        goal.saved += amount;

        if (!goal.completed && goal.saved >= goal.target) {
            goal.completed = true;
        }

        emit GoalFunded(msg.sender, goalId, amount, goal.saved, goal.completed);
    }

    function withdrawGoal(uint256 goalId, uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();

        SavingsGoal storage goal = savingsGoals[msg.sender][goalId];
        if (goal.id == 0) revert InvalidGoal();
        if (amount > goal.saved) revert InsufficientGoalBalance();

        goal.saved -= amount;

        if (goal.completed && goal.saved < goal.target) {
            goal.completed = false;
        }

        vaultBalance[msg.sender] += amount;

        emit GoalWithdrawn(msg.sender, goalId, amount);
    }

    function spend(address recipient, uint256 categoryId, uint256 amount) external nonReentrant {
        if (recipient == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (vaultBalance[msg.sender] < amount) revert InsufficientVaultBalance();

        BudgetCategory storage category = budgets[msg.sender][categoryId];
        if (category.id == 0) revert InvalidCategory();
        if (!category.active) revert CategoryInactive();

        uint256 newSpent = category.spent + amount;
        if (newSpent > category.limit) revert CategoryLimitExceeded();

        category.spent = newSpent;
        vaultBalance[msg.sender] -= amount;
        usdc.safeTransfer(recipient, amount);

        emit Spent(msg.sender, recipient, categoryId, amount);
    }

    /**
     * @notice Withdraw 100% of the caller's funds (vault balance + all goal savings)
     *         in a single transaction. No fees, no penalties, no questions asked.
     *         Goal saved amounts are zeroed; vault balance is zeroed.
     */
    function emergencyWithdrawAll() external nonReentrant {
        uint256 vaultAmt = vaultBalance[msg.sender];

        // Sweep every savings goal back to vaultAmt
        uint256 goalAmt = 0;
        uint256 count = _goalCount[msg.sender];
        for (uint256 i = 1; i <= count; i++) {
            SavingsGoal storage goal = savingsGoals[msg.sender][i];
            if (goal.saved > 0) {
                goalAmt += goal.saved;
                goal.saved = 0;
                goal.completed = false;
            }
        }

        uint256 total = vaultAmt + goalAmt;
        if (total == 0) revert ZeroAmount();

        vaultBalance[msg.sender] = 0;

        usdc.safeTransfer(msg.sender, total);

        emit EmergencyWithdrawn(msg.sender, vaultAmt, goalAmt, total);
    }

    function getCategoryCount(address user) external view returns (uint256) {
        return _categoryCount[user];
    }

    function getGoalCount(address user) external view returns (uint256) {
        return _goalCount[user];
    }

    function getCategory(address user, uint256 id) external view returns (BudgetCategory memory) {
        return budgets[user][id];
    }

    function getGoal(address user, uint256 id) external view returns (SavingsGoal memory) {
        return savingsGoals[user][id];
    }
}
