/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import { ROUTES_PATH} from "../constants/routes.js";
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
      //to-do write expect expression

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
      const BillClass = new Bills({
        document,
        onNavigate,
        store,
        localStorage: null
      });
      const bills = await BillClass.getBills();

      document.body.innerHTML = BillsUI({data: bills, loading:null, error:null})

      const eyeIcon = screen.getAllByTestId('icon-eye')
      const handleClickIconEye = jest.fn(() => BillClass.handleClickIconEye(eyeIcon[0]))
      eyeIcon[0].addEventListener('click', handleClickIconEye)
      userEvent.click(eyeIcon[0])
      expect(handleClickIconEye).toHaveBeenCalled()
      const modal = screen.getByTestId('modale-file')
      expect(modal).toBeTruthy()
    })
  })
})