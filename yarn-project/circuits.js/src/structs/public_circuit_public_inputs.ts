import { makeTuple } from '@aztec/foundation/array';
import { AztecAddress } from '@aztec/foundation/aztec-address';
import { Fr } from '@aztec/foundation/fields';
import {
  BufferReader,
  FieldReader,
  type Tuple,
  serializeToBuffer,
  serializeToFields,
} from '@aztec/foundation/serialize';
import { type FieldsOf } from '@aztec/foundation/types';

import { inspect } from 'util';

import {
  MAX_ENQUEUED_CALLS_PER_CALL,
  MAX_L1_TO_L2_MSG_READ_REQUESTS_PER_CALL,
  MAX_L2_TO_L1_MSGS_PER_CALL,
  MAX_NOTE_HASHES_PER_CALL,
  MAX_NOTE_HASH_READ_REQUESTS_PER_CALL,
  MAX_NULLIFIERS_PER_CALL,
  MAX_NULLIFIER_NON_EXISTENT_READ_REQUESTS_PER_CALL,
  MAX_NULLIFIER_READ_REQUESTS_PER_CALL,
  MAX_PUBLIC_DATA_READS_PER_CALL,
  MAX_PUBLIC_DATA_UPDATE_REQUESTS_PER_CALL,
  MAX_PUBLIC_LOGS_PER_CALL,
  PUBLIC_CIRCUIT_PUBLIC_INPUTS_LENGTH,
} from '../constants.gen.js';
import { isEmptyArray } from '../utils/index.js';
import { BlockHeader } from './block_header.js';
import { CallContext } from './call_context.js';
import { ContractStorageRead } from './contract_storage_read.js';
import { ContractStorageUpdateRequest } from './contract_storage_update_request.js';
import { Gas } from './gas.js';
import { GlobalVariables } from './global_variables.js';
import { L2ToL1Message } from './l2_to_l1_message.js';
import { NoteHash } from './note_hash.js';
import { Nullifier } from './nullifier.js';
import { PublicInnerCallRequest } from './public_inner_call_request.js';
import { PublicLog } from './public_log.js';
import { ReadRequest } from './read_request.js';
import { RevertCode } from './revert_code.js';
import { TreeLeafReadRequest } from './tree_leaf_read_request.js';

// TO BE REMOVED
// This is currently the output of the AVM. It should be replaced by AvmCircuitPublicInputs eventually.
export class PublicCircuitPublicInputs {
  constructor(
    /**
     * Current call context.
     */
    public callContext: CallContext,
    /**
     * Pedersen hash of the arguments of the call.
     */
    public argsHash: Fr,
    /**
     * Pedersen hash of the return values of the call.
     */
    public returnsHash: Fr,
    /**
     * Note Hash tree read requests executed during the call.
     */
    public noteHashReadRequests: Tuple<TreeLeafReadRequest, typeof MAX_NOTE_HASH_READ_REQUESTS_PER_CALL>,
    /**
     * Nullifier read requests executed during the call.
     */
    public nullifierReadRequests: Tuple<ReadRequest, typeof MAX_NULLIFIER_READ_REQUESTS_PER_CALL>,
    /**
     * Nullifier non existent read requests executed during the call.
     */
    public nullifierNonExistentReadRequests: Tuple<
      ReadRequest,
      typeof MAX_NULLIFIER_NON_EXISTENT_READ_REQUESTS_PER_CALL
    >,
    /**
     * L1 to L2 Message Read Requests per call.
     */
    public l1ToL2MsgReadRequests: Tuple<TreeLeafReadRequest, typeof MAX_L1_TO_L2_MSG_READ_REQUESTS_PER_CALL>,
    /**
     * Contract storage update requests executed during the call.
     */
    public contractStorageUpdateRequests: Tuple<
      ContractStorageUpdateRequest,
      typeof MAX_PUBLIC_DATA_UPDATE_REQUESTS_PER_CALL
    >,
    /**
     * Contract storage reads executed during the call.
     */
    public contractStorageReads: Tuple<ContractStorageRead, typeof MAX_PUBLIC_DATA_READS_PER_CALL>,
    /**
     * Public call stack of the current kernel iteration.
     */
    public publicCallRequests: Tuple<PublicInnerCallRequest, typeof MAX_ENQUEUED_CALLS_PER_CALL>,
    /**
     * New note hashes created within a public execution call
     */
    public noteHashes: Tuple<NoteHash, typeof MAX_NOTE_HASHES_PER_CALL>,
    /**
     * New nullifiers created within a public execution call
     */
    public nullifiers: Tuple<Nullifier, typeof MAX_NULLIFIERS_PER_CALL>,
    /**
     * New L2 to L1 messages generated during the call.
     */
    public l2ToL1Msgs: Tuple<L2ToL1Message, typeof MAX_L2_TO_L1_MSGS_PER_CALL>,
    /**
     * The side effect counter when this context was started.
     */
    public startSideEffectCounter: Fr,
    /**
     * The side effect counter when this context finished.
     */
    public endSideEffectCounter: Fr,
    /**
     * The public logs emitted in this function call.
     */
    public publicLogs: Tuple<PublicLog, typeof MAX_PUBLIC_LOGS_PER_CALL>,
    /**
     * Header of a block whose state is used during public execution. Set by sequencer to be a header of a block
     * previous to the one in which the tx is included.
     */
    public historicalHeader: BlockHeader,
    /** Global variables for the block. */
    public globalVariables: GlobalVariables,
    /**
     * Address of the prover.
     */
    public proverAddress: AztecAddress,

    /**
     * Flag indicating if the call was reverted.
     */
    public revertCode: RevertCode,

    /** How much gas was available for execution. */
    public startGasLeft: Gas,

    /** How much gas was left after execution. */
    public endGasLeft: Gas,

    /** Transaction fee in fee juice. Zero in all phases except teardown. */
    public transactionFee: Fr,
  ) {}

  /**
   * Create PublicCircuitPublicInputs from a fields dictionary.
   * @param fields - The dictionary.
   * @returns A PublicCircuitPublicInputs object.
   */
  static from(fields: FieldsOf<PublicCircuitPublicInputs>): PublicCircuitPublicInputs {
    return new PublicCircuitPublicInputs(...PublicCircuitPublicInputs.getFields(fields));
  }

  /**
   * Returns an empty instance.
   * @returns An empty instance.
   */
  public static empty() {
    return new PublicCircuitPublicInputs(
      CallContext.empty(),
      Fr.ZERO,
      Fr.ZERO,
      makeTuple(MAX_NOTE_HASH_READ_REQUESTS_PER_CALL, TreeLeafReadRequest.empty),
      makeTuple(MAX_NULLIFIER_READ_REQUESTS_PER_CALL, ReadRequest.empty),
      makeTuple(MAX_NULLIFIER_NON_EXISTENT_READ_REQUESTS_PER_CALL, ReadRequest.empty),
      makeTuple(MAX_L1_TO_L2_MSG_READ_REQUESTS_PER_CALL, TreeLeafReadRequest.empty),
      makeTuple(MAX_PUBLIC_DATA_UPDATE_REQUESTS_PER_CALL, ContractStorageUpdateRequest.empty),
      makeTuple(MAX_PUBLIC_DATA_READS_PER_CALL, ContractStorageRead.empty),
      makeTuple(MAX_ENQUEUED_CALLS_PER_CALL, PublicInnerCallRequest.empty),
      makeTuple(MAX_NOTE_HASHES_PER_CALL, NoteHash.empty),
      makeTuple(MAX_NULLIFIERS_PER_CALL, Nullifier.empty),
      makeTuple(MAX_L2_TO_L1_MSGS_PER_CALL, L2ToL1Message.empty),
      Fr.ZERO,
      Fr.ZERO,
      makeTuple(MAX_PUBLIC_LOGS_PER_CALL, PublicLog.empty),
      BlockHeader.empty(),
      GlobalVariables.empty(),
      AztecAddress.ZERO,
      RevertCode.OK,
      Gas.empty(),
      Gas.empty(),
      Fr.ZERO,
    );
  }

  isEmpty() {
    return (
      this.callContext.isEmpty() &&
      this.argsHash.isZero() &&
      this.returnsHash.isZero() &&
      isEmptyArray(this.nullifierReadRequests) &&
      isEmptyArray(this.nullifierNonExistentReadRequests) &&
      isEmptyArray(this.l1ToL2MsgReadRequests) &&
      isEmptyArray(this.contractStorageUpdateRequests) &&
      isEmptyArray(this.contractStorageReads) &&
      isEmptyArray(this.publicCallRequests) &&
      isEmptyArray(this.noteHashes) &&
      isEmptyArray(this.nullifiers) &&
      isEmptyArray(this.l2ToL1Msgs) &&
      this.startSideEffectCounter.isZero() &&
      this.endSideEffectCounter.isZero() &&
      isEmptyArray(this.publicLogs) &&
      this.historicalHeader.isEmpty() &&
      this.globalVariables.isEmpty() &&
      this.proverAddress.isZero() &&
      this.revertCode.isOK() &&
      this.startGasLeft.isEmpty() &&
      this.endGasLeft.isEmpty() &&
      this.transactionFee.isZero()
    );
  }

  /**
   * Serialize into a field array. Low-level utility.
   * @param fields - Object with fields.
   * @returns The array.
   */
  static getFields(fields: FieldsOf<PublicCircuitPublicInputs>) {
    return [
      fields.callContext,
      fields.argsHash,
      fields.returnsHash,
      fields.noteHashReadRequests,
      fields.nullifierReadRequests,
      fields.nullifierNonExistentReadRequests,
      fields.l1ToL2MsgReadRequests,
      fields.contractStorageUpdateRequests,
      fields.contractStorageReads,
      fields.publicCallRequests,
      fields.noteHashes,
      fields.nullifiers,
      fields.l2ToL1Msgs,
      fields.startSideEffectCounter,
      fields.endSideEffectCounter,
      fields.publicLogs,
      fields.historicalHeader,
      fields.globalVariables,
      fields.proverAddress,
      fields.revertCode,
      fields.startGasLeft,
      fields.endGasLeft,
      fields.transactionFee,
    ] as const;
  }

  /**
   * Serialize this as a buffer.
   * @returns The buffer.
   */
  toBuffer(): Buffer {
    return serializeToBuffer(...PublicCircuitPublicInputs.getFields(this));
  }

  toFields(): Fr[] {
    const fields = serializeToFields(...PublicCircuitPublicInputs.getFields(this));
    if (fields.length !== PUBLIC_CIRCUIT_PUBLIC_INPUTS_LENGTH) {
      throw new Error(
        `Invalid number of fields for PublicCircuitPublicInputs. Expected ${PUBLIC_CIRCUIT_PUBLIC_INPUTS_LENGTH}, got ${fields.length}`,
      );
    }
    return fields;
  }

  /**
   * Deserializes from a buffer or reader.
   * @param buffer - Buffer or reader to read from.
   * @returns The deserialized instance.
   */
  static fromBuffer(buffer: Buffer | BufferReader): PublicCircuitPublicInputs {
    const reader = BufferReader.asReader(buffer);
    return new PublicCircuitPublicInputs(
      reader.readObject(CallContext),
      reader.readObject(Fr),
      reader.readObject(Fr),
      reader.readArray(MAX_NOTE_HASH_READ_REQUESTS_PER_CALL, TreeLeafReadRequest),
      reader.readArray(MAX_NULLIFIER_READ_REQUESTS_PER_CALL, ReadRequest),
      reader.readArray(MAX_NULLIFIER_NON_EXISTENT_READ_REQUESTS_PER_CALL, ReadRequest),
      reader.readArray(MAX_L1_TO_L2_MSG_READ_REQUESTS_PER_CALL, TreeLeafReadRequest),
      reader.readArray(MAX_PUBLIC_DATA_UPDATE_REQUESTS_PER_CALL, ContractStorageUpdateRequest),
      reader.readArray(MAX_PUBLIC_DATA_READS_PER_CALL, ContractStorageRead),
      reader.readArray(MAX_ENQUEUED_CALLS_PER_CALL, PublicInnerCallRequest),
      reader.readArray(MAX_NOTE_HASHES_PER_CALL, NoteHash),
      reader.readArray(MAX_NULLIFIERS_PER_CALL, Nullifier),
      reader.readArray(MAX_L2_TO_L1_MSGS_PER_CALL, L2ToL1Message),
      reader.readObject(Fr),
      reader.readObject(Fr),
      reader.readArray(MAX_PUBLIC_LOGS_PER_CALL, PublicLog),
      reader.readObject(BlockHeader),
      reader.readObject(GlobalVariables),
      reader.readObject(AztecAddress),
      reader.readObject(RevertCode),
      reader.readObject(Gas),
      reader.readObject(Gas),
      reader.readObject(Fr),
    );
  }

  static fromFields(fields: Fr[] | FieldReader): PublicCircuitPublicInputs {
    const reader = FieldReader.asReader(fields);

    return new PublicCircuitPublicInputs(
      CallContext.fromFields(reader),
      reader.readField(),
      reader.readField(),
      reader.readArray(MAX_NOTE_HASH_READ_REQUESTS_PER_CALL, TreeLeafReadRequest),
      reader.readArray(MAX_NULLIFIER_READ_REQUESTS_PER_CALL, ReadRequest),
      reader.readArray(MAX_NULLIFIER_NON_EXISTENT_READ_REQUESTS_PER_CALL, ReadRequest),
      reader.readArray(MAX_L1_TO_L2_MSG_READ_REQUESTS_PER_CALL, TreeLeafReadRequest),
      reader.readArray(MAX_PUBLIC_DATA_UPDATE_REQUESTS_PER_CALL, ContractStorageUpdateRequest),
      reader.readArray(MAX_PUBLIC_DATA_READS_PER_CALL, ContractStorageRead),
      reader.readArray(MAX_ENQUEUED_CALLS_PER_CALL, PublicInnerCallRequest),
      reader.readArray(MAX_NOTE_HASHES_PER_CALL, NoteHash),
      reader.readArray(MAX_NULLIFIERS_PER_CALL, Nullifier),
      reader.readArray(MAX_L2_TO_L1_MSGS_PER_CALL, L2ToL1Message),
      reader.readField(),
      reader.readField(),
      reader.readArray(MAX_PUBLIC_LOGS_PER_CALL, PublicLog),
      BlockHeader.fromFields(reader),
      GlobalVariables.fromFields(reader),
      AztecAddress.fromFields(reader),
      RevertCode.fromFields(reader),
      Gas.fromFields(reader),
      Gas.fromFields(reader),
      reader.readField(),
    );
  }

  [inspect.custom]() {
    return `PublicCircuitPublicInputs {
      callContext: ${inspect(this.callContext)},
      argsHash: ${inspect(this.argsHash)},
      returnsHash: ${inspect(this.returnsHash)},
      noteHashReadRequests: [${this.noteHashReadRequests
        .filter(x => !x.isEmpty())
        .map(h => inspect(h))
        .join(', ')}]},
      nullifierReadRequests: [${this.nullifierReadRequests
        .filter(x => !x.isEmpty())
        .map(h => inspect(h))
        .join(', ')}]},
      nullifierNonExistentReadRequests: [${this.nullifierNonExistentReadRequests
        .filter(x => !x.isEmpty())
        .map(h => inspect(h))
        .join(', ')}]},
      l1ToL2MsgReadRequests: [${this.l1ToL2MsgReadRequests
        .filter(x => !x.isEmpty())
        .map(h => inspect(h))
        .join(', ')}]},
      contractStorageUpdateRequests: [${this.contractStorageUpdateRequests
        .filter(x => !x.isEmpty())
        .map(h => inspect(h))
        .join(', ')}]},
      contractStorageReads: [${this.contractStorageReads
        .filter(x => !x.isEmpty())
        .map(h => inspect(h))
        .join(', ')}]},
      publicCallRequests: [${this.publicCallRequests
        .filter(x => !x.isEmpty())
        .map(h => inspect(h))
        .join(', ')}]},
      noteHashes: [${this.noteHashes
        .filter(x => !x.isEmpty())
        .map(h => inspect(h))
        .join(', ')}]},
      nullifiers: [${this.nullifiers
        .filter(x => !x.isEmpty())
        .map(h => inspect(h))
        .join(', ')}]},
      l2ToL1Msgs: [${this.l2ToL1Msgs
        .filter(x => !x.isEmpty())
        .map(h => inspect(h))
        .join(', ')}]},
      startSideEffectCounter: ${inspect(this.startSideEffectCounter)},
      endSideEffectCounter: ${inspect(this.endSideEffectCounter)},
      startSideEffectCounter: ${inspect(this.startSideEffectCounter)},
      publicLogs: [${this.publicLogs
        .filter(x => !x.isEmpty())
        .map(h => inspect(h))
        .join(', ')}]},
      historicalHeader: ${inspect(this.historicalHeader)},
      globalVariables: ${inspect(this.globalVariables)},
      proverAddress: ${inspect(this.proverAddress)},
      revertCode: ${inspect(this.revertCode)},
      startGasLeft: ${inspect(this.startGasLeft)},
      endGasLeft: ${inspect(this.endGasLeft)},
      transactionFee: ${inspect(this.transactionFee)},
      }`;
  }
}
