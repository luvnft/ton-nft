import {RawCurrencyCollection, RawMessage, Slice} from "ton";
import {readCurrencyCollection, readMessage} from "./messageUtils";

// out_list_empty$_ = OutList 0;
// out_list$_ {n:#} prev:^(OutList n) action:OutAction
//     = OutList (n + 1);
// action_send_msg#0ec3c86d mode:(## 8)
// out_msg:^(MessageRelaxed Any) = OutAction;
// action_set_code#ad4de08e new_code:^Cell = OutAction;
// action_reserve_currency#36e6b809 mode:(## 8)
// currency:CurrencyCollection = OutAction;
// libref_hash$0 lib_hash:bits256 = LibRef;
// libref_ref$1 library:^Cell = LibRef;
// action_change_library#26fa1dd4 mode:(## 7) { mode <= 2 }
// libref:LibRef = OutAction;
//
// out_list_node$_ prev:^Cell action:OutAction = OutListNode;

export type SendMsgOutAction = { type: 'send_msg', message: RawMessage, mode: number }
export type ReserveCurrencyAction = { type: 'reserve_currency', mode: number, currency: RawCurrencyCollection }
export type UnknownOutAction = { type: 'unknown' }

export type OutAction =
    | SendMsgOutAction
    | ReserveCurrencyAction
    | UnknownOutAction

export function parseActionsList(actions: Slice): OutAction[] {
    let list: any[] = []

    let ref: Slice

    let outAction: OutAction

    try {
        ref = actions.readRef()
    } catch (e) {
        return list
    }

    let magic = actions.readUint(32).toNumber()
    if (magic === 0x0ec3c86d) {
        outAction = {
            type: 'send_msg',
            mode: actions.readUint(8).toNumber(),
            message: readMessage(actions.readRef())
        }
    } else if (magic === 0x36e6b809) {
        outAction = {
            type: 'reserve_currency',
            mode: actions.readUint(8).toNumber(),
            currency: readCurrencyCollection(actions)
        }
    } else {
        outAction = { type: 'unknown' }
    }

    list.push(outAction)
    list.push(...parseActionsList(ref))
    return list
}