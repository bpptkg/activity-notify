import { Memory, Low } from 'lowdb'

type Data = {mepas: number, melab: number, date: string, alertType: number}
export const memoryDb = new Low<Data>(new Memory(), {
    mepas: 0,
    melab: 0,
    date: '',
    alertType: 0
})