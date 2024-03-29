/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import { ROUTES, ROUTES_PATH } from "../constants/routes"
import {localStorageMock} from "../__mocks__/localStorage.js";
import store from "../__mocks__/store.js";

import router from "../app/Router.js";
import Bills from "../containers/Bills.js";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.classList.contains('active-icon')).toBeTruthy()
    })
    test("Then bills should be ordered from earliest to latest", async () => {
      const BillClass = new Bills({
        document,
        onNavigate,
        store,
        localStorage: null,
      });
      const storeBills = await BillClass.getBills();
      const dates = storeBills.map((bill) => bill.date);
      const antiChrono = (a, b) => (a.date < b.date ? 1 : -1);
      const datesSorted = dates.sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  })
  describe("When I click on the eye icon", () => {
    test("Then a modal should open", async () => {
      const bills = await store.bills().list();
      $.fn.modal = jest.fn(() => document.getElementById("modaleFile").classList.add("show"));
      document.body.innerHTML = BillsUI({data: bills, loading:null, error:null})
      const BillClass = new Bills({
        document,
        onNavigate,
        store,
        localStorage: null
      });

      const eyeIcon = screen.getAllByTestId('icon-eye')[0]
      const handleClickIconEye = jest.fn(() => BillClass.handleClickIconEye(eyeIcon))
      eyeIcon.addEventListener('click', handleClickIconEye);
      userEvent.click(eyeIcon)
      expect(handleClickIconEye).toHaveBeenCalled()
      const modal = document.getElementById('modaleFile')
      expect(modal.classList.contains('show')).toBeTruthy()
    })
  })
  describe('When I click on new bill button', () => {
    test('Then I should be sent to the new bills page containing a form', async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const BillClass = new Bills({
        document,
        onNavigate,
        store,
        localStorage: null
      });
      const bills = await BillClass.getBills();

      document.body.innerHTML = BillsUI({data: bills, loading:null, error:null})

      const newBillButton = screen.getByTestId("btn-new-bill")
      const handleClickNewBill = jest.fn((e) => BillClass.handleClickNewBill())
      newBillButton.addEventListener("click", handleClickNewBill)
      userEvent.click(newBillButton)
      expect(handleClickNewBill).toHaveBeenCalled()
      const newBillForm = screen.queryByTestId("form-new-bill")
      expect(newBillForm).toBeTruthy()
    })
  })
  describe("Given I am a user connected as employee", () => {
    describe("When I navigate to the bills page", () => {
      test("Then fetches bills from mock API GET", async () => {
        localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "e@e" }));
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.append(root)
        router()
        const billsContainer = new Bills({
          document,
          onNavigate,
          store,
          localStorage: window.localStorage,
        });
  
        const billsList = await billsContainer.getBills();
        expect(billsList.length).toBeGreaterThan(0);
      })
    })
   describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(store, "bills")
        Object.defineProperty(
            window,
            'localStorage',
            { value: localStorageMock }
        )
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee',
          email: "e@e"
        }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.appendChild(root)
        router()
      })
      test("Then fetches bills from an API and fails with 404 message error", async () => {
        store.bills.mockImplementationOnce(() => {
          return {
            list : () =>  {
              return Promise.reject(new Error("Erreur 404"))
            }
          }})
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = await screen.getByTestId('error-message')
        expect(message).toBeTruthy()
      })
  
      test("Then fetches messages from an API and fails with 500 message error", async () => {
        store.bills.mockImplementationOnce(() => {
          return {
            list : () =>  {
              return Promise.reject(new Error("Erreur 500"))
            }
          }})
  
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = await screen.getByTestId('error-message')
        expect(message).toBeTruthy()
      })
    })
  })
})

