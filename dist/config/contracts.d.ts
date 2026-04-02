export declare const UNISWAP_V3: {
    factory: `0x${string}`;
    quoterV2: `0x${string}`;
    swapRouter02: `0x${string}`;
};
export declare const GMX_V2: {
    reader: `0x${string}`;
    dataStore: `0x${string}`;
    eventEmitter: `0x${string}`;
    orderHandler: `0x${string}`;
    depositVault: `0x${string}`;
    withdrawalVault: `0x${string}`;
};
export declare const CAMELOT: {
    router: `0x${string}`;
    factory: `0x${string}`;
    quoterV2: `0x${string}`;
};
export declare const AAVE_V3: {
    pool: `0x${string}`;
    poolDataProvider: `0x${string}`;
    oracle: `0x${string}`;
};
export declare const IDENTITY_REGISTRY: {
    arbitrumOne: `0x${string}`;
    arbitrumSepolia: `0x${string}`;
};
export declare const ERC20_ABI: readonly [{
    readonly type: "function";
    readonly name: "balanceOf";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "account";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "decimals";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint8";
    }];
}, {
    readonly type: "function";
    readonly name: "symbol";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "string";
    }];
}, {
    readonly type: "function";
    readonly name: "name";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "string";
    }];
}, {
    readonly type: "function";
    readonly name: "totalSupply";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "allowance";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "owner";
        readonly type: "address";
    }, {
        readonly name: "spender";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "approve";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "spender";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bool";
    }];
}, {
    readonly type: "event";
    readonly name: "Transfer";
    readonly inputs: readonly [{
        readonly name: "from";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "to";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "value";
        readonly type: "uint256";
        readonly indexed: false;
    }];
}];
export declare const QUOTER_V2_ABI: readonly [{
    readonly type: "function";
    readonly name: "quoteExactInputSingle";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "params";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "tokenIn";
            readonly type: "address";
        }, {
            readonly name: "tokenOut";
            readonly type: "address";
        }, {
            readonly name: "amountIn";
            readonly type: "uint256";
        }, {
            readonly name: "fee";
            readonly type: "uint24";
        }, {
            readonly name: "sqrtPriceLimitX96";
            readonly type: "uint160";
        }];
    }];
    readonly outputs: readonly [{
        readonly name: "amountOut";
        readonly type: "uint256";
    }, {
        readonly name: "sqrtPriceX96After";
        readonly type: "uint160";
    }, {
        readonly name: "initializedTicksCrossed";
        readonly type: "uint32";
    }, {
        readonly name: "gasEstimate";
        readonly type: "uint256";
    }];
}];
export declare const SWAP_ROUTER_ABI: readonly [{
    readonly type: "function";
    readonly name: "exactInputSingle";
    readonly stateMutability: "payable";
    readonly inputs: readonly [{
        readonly name: "params";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "tokenIn";
            readonly type: "address";
        }, {
            readonly name: "tokenOut";
            readonly type: "address";
        }, {
            readonly name: "fee";
            readonly type: "uint24";
        }, {
            readonly name: "recipient";
            readonly type: "address";
        }, {
            readonly name: "amountIn";
            readonly type: "uint256";
        }, {
            readonly name: "amountOutMinimum";
            readonly type: "uint256";
        }, {
            readonly name: "sqrtPriceLimitX96";
            readonly type: "uint160";
        }];
    }];
    readonly outputs: readonly [{
        readonly name: "amountOut";
        readonly type: "uint256";
    }];
}];
export declare const GMX_READER_ABI: readonly [{
    readonly type: "function";
    readonly name: "getMarkets";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "dataStore";
        readonly type: "address";
    }, {
        readonly name: "start";
        readonly type: "uint256";
    }, {
        readonly name: "end";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "marketToken";
            readonly type: "address";
        }, {
            readonly name: "indexToken";
            readonly type: "address";
        }, {
            readonly name: "longToken";
            readonly type: "address";
        }, {
            readonly name: "shortToken";
            readonly type: "address";
        }];
    }];
}, {
    readonly type: "function";
    readonly name: "getMarketTokenPrice";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "dataStore";
        readonly type: "address";
    }, {
        readonly name: "market";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "marketToken";
            readonly type: "address";
        }, {
            readonly name: "indexToken";
            readonly type: "address";
        }, {
            readonly name: "longToken";
            readonly type: "address";
        }, {
            readonly name: "shortToken";
            readonly type: "address";
        }];
    }, {
        readonly name: "indexTokenPrice";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "min";
            readonly type: "uint256";
        }, {
            readonly name: "max";
            readonly type: "uint256";
        }];
    }, {
        readonly name: "longTokenPrice";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "min";
            readonly type: "uint256";
        }, {
            readonly name: "max";
            readonly type: "uint256";
        }];
    }, {
        readonly name: "shortTokenPrice";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "min";
            readonly type: "uint256";
        }, {
            readonly name: "max";
            readonly type: "uint256";
        }];
    }, {
        readonly name: "pnlFactorType";
        readonly type: "bytes32";
    }, {
        readonly name: "maximize";
        readonly type: "bool";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "int256";
    }, {
        readonly name: "";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "poolValue";
            readonly type: "int256";
        }, {
            readonly name: "longPnl";
            readonly type: "int256";
        }, {
            readonly name: "shortPnl";
            readonly type: "int256";
        }, {
            readonly name: "netPnl";
            readonly type: "int256";
        }, {
            readonly name: "longTokenAmount";
            readonly type: "uint256";
        }, {
            readonly name: "shortTokenAmount";
            readonly type: "uint256";
        }, {
            readonly name: "longTokenUsd";
            readonly type: "uint256";
        }, {
            readonly name: "shortTokenUsd";
            readonly type: "uint256";
        }, {
            readonly name: "totalBorrowingFees";
            readonly type: "uint256";
        }, {
            readonly name: "borrowingFeePoolFactor";
            readonly type: "uint256";
        }, {
            readonly name: "impactPoolAmount";
            readonly type: "uint256";
        }];
    }];
}, {
    readonly type: "function";
    readonly name: "getAccountPositions";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "dataStore";
        readonly type: "address";
    }, {
        readonly name: "account";
        readonly type: "address";
    }, {
        readonly name: "start";
        readonly type: "uint256";
    }, {
        readonly name: "end";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "addresses";
            readonly type: "tuple";
            readonly components: readonly [{
                readonly name: "account";
                readonly type: "address";
            }, {
                readonly name: "market";
                readonly type: "address";
            }, {
                readonly name: "collateralToken";
                readonly type: "address";
            }];
        }, {
            readonly name: "numbers";
            readonly type: "tuple";
            readonly components: readonly [{
                readonly name: "sizeInUsd";
                readonly type: "uint256";
            }, {
                readonly name: "sizeInTokens";
                readonly type: "uint256";
            }, {
                readonly name: "collateralAmount";
                readonly type: "uint256";
            }, {
                readonly name: "borrowingFactor";
                readonly type: "uint256";
            }, {
                readonly name: "fundingFeeAmountPerSize";
                readonly type: "uint256";
            }, {
                readonly name: "longTokenClaimableFundingAmountPerSize";
                readonly type: "uint256";
            }, {
                readonly name: "shortTokenClaimableFundingAmountPerSize";
                readonly type: "uint256";
            }, {
                readonly name: "increasedAtBlock";
                readonly type: "uint256";
            }, {
                readonly name: "decreasedAtBlock";
                readonly type: "uint256";
            }, {
                readonly name: "increasedAtTime";
                readonly type: "uint256";
            }, {
                readonly name: "decreasedAtTime";
                readonly type: "uint256";
            }];
        }, {
            readonly name: "flags";
            readonly type: "tuple";
            readonly components: readonly [{
                readonly name: "isLong";
                readonly type: "bool";
            }];
        }];
    }];
}];
export declare const GMX_DATASTORE_ABI: readonly [{
    readonly type: "function";
    readonly name: "getUint";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "key";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "getInt";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "key";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "int256";
    }];
}, {
    readonly type: "function";
    readonly name: "getAddress";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "key";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "address";
    }];
}, {
    readonly type: "function";
    readonly name: "getBool";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "key";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bool";
    }];
}];
export declare const AAVE_POOL_ABI: readonly [{
    readonly type: "function";
    readonly name: "getUserAccountData";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "user";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "totalCollateralBase";
        readonly type: "uint256";
    }, {
        readonly name: "totalDebtBase";
        readonly type: "uint256";
    }, {
        readonly name: "availableBorrowsBase";
        readonly type: "uint256";
    }, {
        readonly name: "currentLiquidationThreshold";
        readonly type: "uint256";
    }, {
        readonly name: "ltv";
        readonly type: "uint256";
    }, {
        readonly name: "healthFactor";
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "getReservesList";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "address[]";
    }];
}];
export declare const AAVE_DATA_PROVIDER_ABI: readonly [{
    readonly type: "function";
    readonly name: "getUserReserveData";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "asset";
        readonly type: "address";
    }, {
        readonly name: "user";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "currentATokenBalance";
        readonly type: "uint256";
    }, {
        readonly name: "currentStableDebt";
        readonly type: "uint256";
    }, {
        readonly name: "currentVariableDebt";
        readonly type: "uint256";
    }, {
        readonly name: "principalStableDebt";
        readonly type: "uint256";
    }, {
        readonly name: "scaledVariableDebt";
        readonly type: "uint256";
    }, {
        readonly name: "stableBorrowRate";
        readonly type: "uint256";
    }, {
        readonly name: "liquidityRate";
        readonly type: "uint256";
    }, {
        readonly name: "stableRateLastUpdated";
        readonly type: "uint40";
    }, {
        readonly name: "usageAsCollateralEnabled";
        readonly type: "bool";
    }];
}, {
    readonly type: "function";
    readonly name: "getReserveData";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "asset";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "unbacked";
        readonly type: "uint256";
    }, {
        readonly name: "accruedToTreasuryScaled";
        readonly type: "uint256";
    }, {
        readonly name: "totalAToken";
        readonly type: "uint256";
    }, {
        readonly name: "totalStableDebt";
        readonly type: "uint256";
    }, {
        readonly name: "totalVariableDebt";
        readonly type: "uint256";
    }, {
        readonly name: "liquidityRate";
        readonly type: "uint256";
    }, {
        readonly name: "variableBorrowRate";
        readonly type: "uint256";
    }, {
        readonly name: "stableBorrowRate";
        readonly type: "uint256";
    }, {
        readonly name: "averageStableBorrowRate";
        readonly type: "uint256";
    }, {
        readonly name: "liquidityIndex";
        readonly type: "uint256";
    }, {
        readonly name: "variableBorrowIndex";
        readonly type: "uint256";
    }, {
        readonly name: "lastUpdateTimestamp";
        readonly type: "uint40";
    }];
}, {
    readonly type: "function";
    readonly name: "getReserveConfigurationData";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "asset";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "decimals";
        readonly type: "uint256";
    }, {
        readonly name: "ltv";
        readonly type: "uint256";
    }, {
        readonly name: "liquidationThreshold";
        readonly type: "uint256";
    }, {
        readonly name: "liquidationBonus";
        readonly type: "uint256";
    }, {
        readonly name: "reserveFactor";
        readonly type: "uint256";
    }, {
        readonly name: "usageAsCollateralEnabled";
        readonly type: "bool";
    }, {
        readonly name: "borrowingEnabled";
        readonly type: "bool";
    }, {
        readonly name: "stableBorrowRateEnabled";
        readonly type: "bool";
    }, {
        readonly name: "isActive";
        readonly type: "bool";
    }, {
        readonly name: "isFrozen";
        readonly type: "bool";
    }];
}];
export declare const AAVE_ORACLE_ABI: readonly [{
    readonly type: "function";
    readonly name: "getAssetPrice";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "asset";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "getAssetsPrices";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "assets";
        readonly type: "address[]";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256[]";
    }];
}];
export declare const CAMELOT_QUOTER_ABI: readonly [{
    readonly type: "function";
    readonly name: "quoteExactInputSingle";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "tokenIn";
        readonly type: "address";
    }, {
        readonly name: "tokenOut";
        readonly type: "address";
    }, {
        readonly name: "amountIn";
        readonly type: "uint256";
    }, {
        readonly name: "limitSqrtPrice";
        readonly type: "uint160";
    }];
    readonly outputs: readonly [{
        readonly name: "amountOut";
        readonly type: "uint256";
    }, {
        readonly name: "fee";
        readonly type: "uint16";
    }];
}];
export declare const IDENTITY_REGISTRY_ABI: readonly [{
    readonly type: "function";
    readonly name: "register";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "agentURI";
        readonly type: "string";
    }];
    readonly outputs: readonly [{
        readonly name: "agentId";
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "setAgentURI";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "agentId";
        readonly type: "uint256";
    }, {
        readonly name: "newURI";
        readonly type: "string";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "tokenURI";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "tokenId";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "string";
    }];
}, {
    readonly type: "function";
    readonly name: "ownerOf";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "tokenId";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "address";
    }];
}, {
    readonly type: "function";
    readonly name: "balanceOf";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "owner";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
}, {
    readonly type: "event";
    readonly name: "Transfer";
    readonly inputs: readonly [{
        readonly name: "from";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "to";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "tokenId";
        readonly type: "uint256";
        readonly indexed: true;
    }];
}];
//# sourceMappingURL=contracts.d.ts.map