import { FieldValues } from "react-hook-form"
import { useSelector } from "react-redux"
import { delay } from "../delay"
import { RootState } from "../redux/store"

export function useAuthentication() {
  const users = useSelector((state: RootState) => state.users.userList || [])

  const authenticate = async (fieldValues: FieldValues) => {
    await delay(2000)
    const { branchId, username, password } = fieldValues
    const user = users.find(
      (account) =>
        String(account.username) === username &&
        String(account.password) === password &&
        String(account.branchId) === branchId
    )
    return user
  }

  return { authenticate }
}
