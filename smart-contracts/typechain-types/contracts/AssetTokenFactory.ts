/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumberish,
  BytesLike,
  FunctionFragment,
  Result,
  Interface,
  EventFragment,
  AddressLike,
  ContractRunner,
  ContractMethod,
  Listener,
} from "ethers";
import type {
  TypedContractEvent,
  TypedDeferredTopicFilter,
  TypedEventLog,
  TypedLogDescription,
  TypedListener,
  TypedContractMethod,
} from "../common";

export declare namespace AssetTokenFactory {
  export type AssetInfoStruct = {
    name: string;
    symbol: string;
    tokenAddress: AddressLike;
    issuer: AddressLike;
    totalSupply: BigNumberish;
    createdAt: BigNumberish;
    isActive: boolean;
    metadataURI: string;
  };

  export type AssetInfoStructOutput = [
    name: string,
    symbol: string,
    tokenAddress: string,
    issuer: string,
    totalSupply: bigint,
    createdAt: bigint,
    isActive: boolean,
    metadataURI: string
  ] & {
    name: string;
    symbol: string;
    tokenAddress: string;
    issuer: string;
    totalSupply: bigint;
    createdAt: bigint;
    isActive: boolean;
    metadataURI: string;
  };
}

export interface AssetTokenFactoryInterface extends Interface {
  getFunction(
    nameOrSignature:
      | "COMPLIANCE_ROLE"
      | "DEFAULT_ADMIN_ROLE"
      | "ISSUER_ROLE"
      | "allAssets"
      | "assets"
      | "createAssetToken"
      | "creationFee"
      | "emergencyWithdraw"
      | "feeRecipient"
      | "getAllAssets"
      | "getAssetInfo"
      | "getAssetsByIssuer"
      | "getRoleAdmin"
      | "grantRole"
      | "hasRole"
      | "issuerAssets"
      | "kycContract"
      | "pause"
      | "paused"
      | "renounceRole"
      | "revokeRole"
      | "setAssetStatus"
      | "supportsInterface"
      | "unpause"
      | "updateCreationFee"
      | "updateFeeRecipient"
  ): FunctionFragment;

  getEvent(
    nameOrSignatureOrTopic:
      | "AssetStatusUpdated"
      | "AssetTokenCreated"
      | "Paused"
      | "RoleAdminChanged"
      | "RoleGranted"
      | "RoleRevoked"
      | "Unpaused"
  ): EventFragment;

  encodeFunctionData(
    functionFragment: "COMPLIANCE_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "DEFAULT_ADMIN_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "ISSUER_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "allAssets",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "assets", values: [BytesLike]): string;
  encodeFunctionData(
    functionFragment: "createAssetToken",
    values: [string, string, BigNumberish, string]
  ): string;
  encodeFunctionData(
    functionFragment: "creationFee",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "emergencyWithdraw",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "feeRecipient",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getAllAssets",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getAssetInfo",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "getAssetsByIssuer",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "getRoleAdmin",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "grantRole",
    values: [BytesLike, AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "hasRole",
    values: [BytesLike, AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "issuerAssets",
    values: [AddressLike, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "kycContract",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "pause", values?: undefined): string;
  encodeFunctionData(functionFragment: "paused", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "renounceRole",
    values: [BytesLike, AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "revokeRole",
    values: [BytesLike, AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "setAssetStatus",
    values: [BytesLike, boolean]
  ): string;
  encodeFunctionData(
    functionFragment: "supportsInterface",
    values: [BytesLike]
  ): string;
  encodeFunctionData(functionFragment: "unpause", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "updateCreationFee",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "updateFeeRecipient",
    values: [AddressLike]
  ): string;

  decodeFunctionResult(
    functionFragment: "COMPLIANCE_ROLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "DEFAULT_ADMIN_ROLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "ISSUER_ROLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "allAssets", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "assets", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "createAssetToken",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "creationFee",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "emergencyWithdraw",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "feeRecipient",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getAllAssets",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getAssetInfo",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getAssetsByIssuer",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getRoleAdmin",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "grantRole", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "hasRole", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "issuerAssets",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "kycContract",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "pause", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "paused", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "renounceRole",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "revokeRole", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "setAssetStatus",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "supportsInterface",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "unpause", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "updateCreationFee",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "updateFeeRecipient",
    data: BytesLike
  ): Result;
}

export namespace AssetStatusUpdatedEvent {
  export type InputTuple = [assetId: BytesLike, isActive: boolean];
  export type OutputTuple = [assetId: string, isActive: boolean];
  export interface OutputObject {
    assetId: string;
    isActive: boolean;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace AssetTokenCreatedEvent {
  export type InputTuple = [
    assetId: BytesLike,
    tokenAddress: AddressLike,
    issuer: AddressLike,
    name: string,
    symbol: string
  ];
  export type OutputTuple = [
    assetId: string,
    tokenAddress: string,
    issuer: string,
    name: string,
    symbol: string
  ];
  export interface OutputObject {
    assetId: string;
    tokenAddress: string;
    issuer: string;
    name: string;
    symbol: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace PausedEvent {
  export type InputTuple = [account: AddressLike];
  export type OutputTuple = [account: string];
  export interface OutputObject {
    account: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace RoleAdminChangedEvent {
  export type InputTuple = [
    role: BytesLike,
    previousAdminRole: BytesLike,
    newAdminRole: BytesLike
  ];
  export type OutputTuple = [
    role: string,
    previousAdminRole: string,
    newAdminRole: string
  ];
  export interface OutputObject {
    role: string;
    previousAdminRole: string;
    newAdminRole: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace RoleGrantedEvent {
  export type InputTuple = [
    role: BytesLike,
    account: AddressLike,
    sender: AddressLike
  ];
  export type OutputTuple = [role: string, account: string, sender: string];
  export interface OutputObject {
    role: string;
    account: string;
    sender: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace RoleRevokedEvent {
  export type InputTuple = [
    role: BytesLike,
    account: AddressLike,
    sender: AddressLike
  ];
  export type OutputTuple = [role: string, account: string, sender: string];
  export interface OutputObject {
    role: string;
    account: string;
    sender: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace UnpausedEvent {
  export type InputTuple = [account: AddressLike];
  export type OutputTuple = [account: string];
  export interface OutputObject {
    account: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export interface AssetTokenFactory extends BaseContract {
  connect(runner?: ContractRunner | null): AssetTokenFactory;
  waitForDeployment(): Promise<this>;

  interface: AssetTokenFactoryInterface;

  queryFilter<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;
  queryFilter<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;

  on<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  on<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  once<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  once<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  listeners<TCEvent extends TypedContractEvent>(
    event: TCEvent
  ): Promise<Array<TypedListener<TCEvent>>>;
  listeners(eventName?: string): Promise<Array<Listener>>;
  removeAllListeners<TCEvent extends TypedContractEvent>(
    event?: TCEvent
  ): Promise<this>;

  COMPLIANCE_ROLE: TypedContractMethod<[], [string], "view">;

  DEFAULT_ADMIN_ROLE: TypedContractMethod<[], [string], "view">;

  ISSUER_ROLE: TypedContractMethod<[], [string], "view">;

  allAssets: TypedContractMethod<[arg0: BigNumberish], [string], "view">;

  assets: TypedContractMethod<
    [arg0: BytesLike],
    [
      [string, string, string, string, bigint, bigint, boolean, string] & {
        name: string;
        symbol: string;
        tokenAddress: string;
        issuer: string;
        totalSupply: bigint;
        createdAt: bigint;
        isActive: boolean;
        metadataURI: string;
      }
    ],
    "view"
  >;

  createAssetToken: TypedContractMethod<
    [
      name: string,
      symbol: string,
      initialSupply: BigNumberish,
      metadataURI: string
    ],
    [void],
    "payable"
  >;

  creationFee: TypedContractMethod<[], [bigint], "view">;

  emergencyWithdraw: TypedContractMethod<[], [void], "nonpayable">;

  feeRecipient: TypedContractMethod<[], [string], "view">;

  getAllAssets: TypedContractMethod<[], [string[]], "view">;

  getAssetInfo: TypedContractMethod<
    [assetId: BytesLike],
    [AssetTokenFactory.AssetInfoStructOutput],
    "view"
  >;

  getAssetsByIssuer: TypedContractMethod<
    [issuer: AddressLike],
    [string[]],
    "view"
  >;

  getRoleAdmin: TypedContractMethod<[role: BytesLike], [string], "view">;

  grantRole: TypedContractMethod<
    [role: BytesLike, account: AddressLike],
    [void],
    "nonpayable"
  >;

  hasRole: TypedContractMethod<
    [role: BytesLike, account: AddressLike],
    [boolean],
    "view"
  >;

  issuerAssets: TypedContractMethod<
    [arg0: AddressLike, arg1: BigNumberish],
    [string],
    "view"
  >;

  kycContract: TypedContractMethod<[], [string], "view">;

  pause: TypedContractMethod<[], [void], "nonpayable">;

  paused: TypedContractMethod<[], [boolean], "view">;

  renounceRole: TypedContractMethod<
    [role: BytesLike, callerConfirmation: AddressLike],
    [void],
    "nonpayable"
  >;

  revokeRole: TypedContractMethod<
    [role: BytesLike, account: AddressLike],
    [void],
    "nonpayable"
  >;

  setAssetStatus: TypedContractMethod<
    [assetId: BytesLike, isActive: boolean],
    [void],
    "nonpayable"
  >;

  supportsInterface: TypedContractMethod<
    [interfaceId: BytesLike],
    [boolean],
    "view"
  >;

  unpause: TypedContractMethod<[], [void], "nonpayable">;

  updateCreationFee: TypedContractMethod<
    [newFee: BigNumberish],
    [void],
    "nonpayable"
  >;

  updateFeeRecipient: TypedContractMethod<
    [newRecipient: AddressLike],
    [void],
    "nonpayable"
  >;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "COMPLIANCE_ROLE"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "DEFAULT_ADMIN_ROLE"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "ISSUER_ROLE"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "allAssets"
  ): TypedContractMethod<[arg0: BigNumberish], [string], "view">;
  getFunction(
    nameOrSignature: "assets"
  ): TypedContractMethod<
    [arg0: BytesLike],
    [
      [string, string, string, string, bigint, bigint, boolean, string] & {
        name: string;
        symbol: string;
        tokenAddress: string;
        issuer: string;
        totalSupply: bigint;
        createdAt: bigint;
        isActive: boolean;
        metadataURI: string;
      }
    ],
    "view"
  >;
  getFunction(
    nameOrSignature: "createAssetToken"
  ): TypedContractMethod<
    [
      name: string,
      symbol: string,
      initialSupply: BigNumberish,
      metadataURI: string
    ],
    [void],
    "payable"
  >;
  getFunction(
    nameOrSignature: "creationFee"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "emergencyWithdraw"
  ): TypedContractMethod<[], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "feeRecipient"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "getAllAssets"
  ): TypedContractMethod<[], [string[]], "view">;
  getFunction(
    nameOrSignature: "getAssetInfo"
  ): TypedContractMethod<
    [assetId: BytesLike],
    [AssetTokenFactory.AssetInfoStructOutput],
    "view"
  >;
  getFunction(
    nameOrSignature: "getAssetsByIssuer"
  ): TypedContractMethod<[issuer: AddressLike], [string[]], "view">;
  getFunction(
    nameOrSignature: "getRoleAdmin"
  ): TypedContractMethod<[role: BytesLike], [string], "view">;
  getFunction(
    nameOrSignature: "grantRole"
  ): TypedContractMethod<
    [role: BytesLike, account: AddressLike],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "hasRole"
  ): TypedContractMethod<
    [role: BytesLike, account: AddressLike],
    [boolean],
    "view"
  >;
  getFunction(
    nameOrSignature: "issuerAssets"
  ): TypedContractMethod<
    [arg0: AddressLike, arg1: BigNumberish],
    [string],
    "view"
  >;
  getFunction(
    nameOrSignature: "kycContract"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "pause"
  ): TypedContractMethod<[], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "paused"
  ): TypedContractMethod<[], [boolean], "view">;
  getFunction(
    nameOrSignature: "renounceRole"
  ): TypedContractMethod<
    [role: BytesLike, callerConfirmation: AddressLike],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "revokeRole"
  ): TypedContractMethod<
    [role: BytesLike, account: AddressLike],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "setAssetStatus"
  ): TypedContractMethod<
    [assetId: BytesLike, isActive: boolean],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "supportsInterface"
  ): TypedContractMethod<[interfaceId: BytesLike], [boolean], "view">;
  getFunction(
    nameOrSignature: "unpause"
  ): TypedContractMethod<[], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "updateCreationFee"
  ): TypedContractMethod<[newFee: BigNumberish], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "updateFeeRecipient"
  ): TypedContractMethod<[newRecipient: AddressLike], [void], "nonpayable">;

  getEvent(
    key: "AssetStatusUpdated"
  ): TypedContractEvent<
    AssetStatusUpdatedEvent.InputTuple,
    AssetStatusUpdatedEvent.OutputTuple,
    AssetStatusUpdatedEvent.OutputObject
  >;
  getEvent(
    key: "AssetTokenCreated"
  ): TypedContractEvent<
    AssetTokenCreatedEvent.InputTuple,
    AssetTokenCreatedEvent.OutputTuple,
    AssetTokenCreatedEvent.OutputObject
  >;
  getEvent(
    key: "Paused"
  ): TypedContractEvent<
    PausedEvent.InputTuple,
    PausedEvent.OutputTuple,
    PausedEvent.OutputObject
  >;
  getEvent(
    key: "RoleAdminChanged"
  ): TypedContractEvent<
    RoleAdminChangedEvent.InputTuple,
    RoleAdminChangedEvent.OutputTuple,
    RoleAdminChangedEvent.OutputObject
  >;
  getEvent(
    key: "RoleGranted"
  ): TypedContractEvent<
    RoleGrantedEvent.InputTuple,
    RoleGrantedEvent.OutputTuple,
    RoleGrantedEvent.OutputObject
  >;
  getEvent(
    key: "RoleRevoked"
  ): TypedContractEvent<
    RoleRevokedEvent.InputTuple,
    RoleRevokedEvent.OutputTuple,
    RoleRevokedEvent.OutputObject
  >;
  getEvent(
    key: "Unpaused"
  ): TypedContractEvent<
    UnpausedEvent.InputTuple,
    UnpausedEvent.OutputTuple,
    UnpausedEvent.OutputObject
  >;

  filters: {
    "AssetStatusUpdated(bytes32,bool)": TypedContractEvent<
      AssetStatusUpdatedEvent.InputTuple,
      AssetStatusUpdatedEvent.OutputTuple,
      AssetStatusUpdatedEvent.OutputObject
    >;
    AssetStatusUpdated: TypedContractEvent<
      AssetStatusUpdatedEvent.InputTuple,
      AssetStatusUpdatedEvent.OutputTuple,
      AssetStatusUpdatedEvent.OutputObject
    >;

    "AssetTokenCreated(bytes32,address,address,string,string)": TypedContractEvent<
      AssetTokenCreatedEvent.InputTuple,
      AssetTokenCreatedEvent.OutputTuple,
      AssetTokenCreatedEvent.OutputObject
    >;
    AssetTokenCreated: TypedContractEvent<
      AssetTokenCreatedEvent.InputTuple,
      AssetTokenCreatedEvent.OutputTuple,
      AssetTokenCreatedEvent.OutputObject
    >;

    "Paused(address)": TypedContractEvent<
      PausedEvent.InputTuple,
      PausedEvent.OutputTuple,
      PausedEvent.OutputObject
    >;
    Paused: TypedContractEvent<
      PausedEvent.InputTuple,
      PausedEvent.OutputTuple,
      PausedEvent.OutputObject
    >;

    "RoleAdminChanged(bytes32,bytes32,bytes32)": TypedContractEvent<
      RoleAdminChangedEvent.InputTuple,
      RoleAdminChangedEvent.OutputTuple,
      RoleAdminChangedEvent.OutputObject
    >;
    RoleAdminChanged: TypedContractEvent<
      RoleAdminChangedEvent.InputTuple,
      RoleAdminChangedEvent.OutputTuple,
      RoleAdminChangedEvent.OutputObject
    >;

    "RoleGranted(bytes32,address,address)": TypedContractEvent<
      RoleGrantedEvent.InputTuple,
      RoleGrantedEvent.OutputTuple,
      RoleGrantedEvent.OutputObject
    >;
    RoleGranted: TypedContractEvent<
      RoleGrantedEvent.InputTuple,
      RoleGrantedEvent.OutputTuple,
      RoleGrantedEvent.OutputObject
    >;

    "RoleRevoked(bytes32,address,address)": TypedContractEvent<
      RoleRevokedEvent.InputTuple,
      RoleRevokedEvent.OutputTuple,
      RoleRevokedEvent.OutputObject
    >;
    RoleRevoked: TypedContractEvent<
      RoleRevokedEvent.InputTuple,
      RoleRevokedEvent.OutputTuple,
      RoleRevokedEvent.OutputObject
    >;

    "Unpaused(address)": TypedContractEvent<
      UnpausedEvent.InputTuple,
      UnpausedEvent.OutputTuple,
      UnpausedEvent.OutputObject
    >;
    Unpaused: TypedContractEvent<
      UnpausedEvent.InputTuple,
      UnpausedEvent.OutputTuple,
      UnpausedEvent.OutputObject
    >;
  };
}
