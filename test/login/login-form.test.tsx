import "@testing-library/jest-dom"
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import LoginForm from "src/app/login/login-form"
import { TUser } from "src/app/types/user"
import SessionProvider from "src/components/SessionProvider"
import { useAuthentication } from "src/lib/authentication/authenticate"

const mockUser: TUser = {
  branchId: 10001,
  username: "testuser01",
  password: "pa55w0rd001",
  firstName: "John",
  middleName: "Sanchez",
  lastName: "Doe",
  position: "Developer",
}

const mockedPushFn = jest.fn()
const authenticateFn = jest.fn().mockResolvedValue(mockUser);

jest.mock("next/navigation", () => {
  return {
    __esModule: true,
    useRouter: () => ({
      push: mockedPushFn,
    }),
  }
})

jest.mock("../../src/lib/authentication/authenticate", () => ({
  useAuthentication: jest.fn().mockReturnValue({ authenticate: jest.fn() }),
}))

describe("Login Form", () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe("When user is logged in", () => {
    beforeEach(() => {
      render(
        <SessionProvider value={{ session: mockUser, setSession: jest.fn() }}>
          <LoginForm />
        </SessionProvider>
      )
    })
    afterEach(() => {})

    it("should redirect to /dashboard when the user is logged in", async () => {
      expect(mockedPushFn).toHaveBeenCalledWith("/dashboard")
    })
  })

  describe("When user is not logged in", () => {
    describe("When authenticate returns a user", () => {
      beforeEach(() => {
        ;(useAuthentication as jest.Mock).mockReturnValue({ authenticate: authenticateFn });
        render(
          <SessionProvider>
            <LoginForm />
          </SessionProvider>
        )
      })
      // ARRANGE
  
      it("should not redirect to /dashboard when the user is not logged in", async () => {
        expect(mockedPushFn).not.toHaveBeenCalled()
      })
  
      it("should render all of the necessary fields in the form", async () => {
        const branchIdField = await screen.findByTestId("branchId")
        const usernameField = await screen.findByTestId("username")
        const passwordField = await screen.findByTestId("password")
        expect(branchIdField).not.toBeNull()
        expect(usernameField).not.toBeNull()
        expect(passwordField).not.toBeNull()
      })
  
      it("should render all of the necessary text in the form", async () => {
        const branchIdField = await screen.findByText("Branch ID")
        const usernameField = await screen.findByText("Username")
        const passwordField = await screen.findByText("Password")
        const loginButton = await screen.getByRole("button", {
          name: /Login/i,
        })
        expect(branchIdField).not.toBeNull()
        expect(usernameField).not.toBeNull()
        expect(passwordField).not.toBeNull()
        expect(loginButton).not.toBeNull()
      })
  
      it.each([
        [123, "asd", "fgh", 1],
        ["asd", undefined, undefined, 0],
        [undefined, "asd", "fgh", 0],
      ])(
        "given branch id = %p, username = %p, password = %p, routing should be pushed to /dashboard %p times",
        async (branchId?: number | string, username?: string, password?: string, result?: number) => {
          const user = userEvent.setup()
          if (branchId) {
            const branchIdField = await screen.findByTestId("branchId")
            await user.type(branchIdField, String(branchId))
          }
          if (username) {
            const usernameField = await screen.findByTestId("username")
            await user.type(usernameField, username)
          }
          if (password) {
            const passwordField = await screen.findByTestId("password")
            await user.type(passwordField, password)
          }
          const loginButton = await screen.findByTestId("loginButton")
          await user.click(loginButton)
  
          expect(authenticateFn).toHaveBeenCalledTimes(result || 0)
        }
      )
  
      it.each([
        [123, "asd", "fgh", false, false, false],
        ["asd", undefined, undefined, true, true, true],
        [undefined, "asd", "fgh", true, false, false],
      ])(
        "given branch id = %p, username = %p, password = %p, error for branch id should be %p, username should be %p, and password should be %p",
        async (
          branchId?: number | string,
          username?: string,
          password?: string,
          branchIdResult?: boolean,
          usernameResult?: boolean,
          passwordResult?: boolean
        ) => {
          const user = userEvent.setup()
          if (branchId) {
            const branchIdField = await screen.findByTestId("branchId")
            await user.type(branchIdField, String(branchId))
          }
          if (username) {
            const usernameField = await screen.findByTestId("username")
            await user.type(usernameField, username)
          }
          if (password) {
            const passwordField = await screen.findByTestId("password")
            await user.type(passwordField, password)
          }
          const loginButton = await screen.findByTestId("loginButton")
          await user.click(loginButton)
  
          expect(Boolean(screen.queryByText("Branch ID is required and should only be a number"))).toBe(branchIdResult)
          expect(Boolean(screen.queryByText("Username is required"))).toBe(usernameResult)
          expect(Boolean(screen.queryByText("Password is required"))).toBe(passwordResult)
        }
      )
    })

    describe("When authenticate return no user", () => {
      it("should show error for invalid credential when authenticate function does not get any user", async () => {
        ;(useAuthentication as jest.Mock).mockReturnValue({ authenticate: jest.fn().mockResolvedValue(null) });
        render(
          <SessionProvider>
            <LoginForm />
          </SessionProvider>
        )
        const user = userEvent.setup()
        const branchIdField = await screen.findByTestId("branchId")
        await user.type(branchIdField, "123")
        const usernameField = await screen.findByTestId("username")
        await user.type(usernameField, "asd")
        const passwordField = await screen.findByTestId("password")
        await user.type(passwordField, "asd")
        const loginButton = await screen.findByTestId("loginButton")
        await user.click(loginButton)
        expect(Boolean(screen.queryByText("Invalid credentials. Please Try again."))).toBeTruthy()
      })
    })

    describe("When authenticate encounters error", () => {
      it("should show error when authenticate function fails", async () => {
        ;(useAuthentication as jest.Mock).mockReturnValue({ authenticate: jest.fn().mockRejectedValue(new Error()) });

        render(
          <SessionProvider>
            <LoginForm />
          </SessionProvider>
        )
        const user = userEvent.setup()
        const branchIdField = await screen.findByTestId("branchId")
        await user.type(branchIdField, "123")
        const usernameField = await screen.findByTestId("username")
        await user.type(usernameField, "asd")
        const passwordField = await screen.findByTestId("password")
        await user.type(passwordField, "asd")
        const loginButton = await screen.findByTestId("loginButton")
        await user.click(loginButton)
        expect(Boolean(screen.queryByText("Unexpected error. Please Try again."))).toBeTruthy()
      })
    })
  })
})
