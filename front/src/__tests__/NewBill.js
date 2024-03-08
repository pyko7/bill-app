/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import {localStorageMock} from "../__mocks__/localStorage.js"
import store from "../__mocks__/store.js"
import { ROUTES_PATH } from "../constants/routes.js";
import router from "../app/Router"
import userEvent from "@testing-library/user-event"

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    beforeEach(() => {
      jest.spyOn(store, "bills");
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "e@e",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
    });

    test("Then new bill form should be displayed", async () => {
      document.body.innerHTML = NewBillUI();
      const form = screen.getByTestId("form-new-bill");
      expect(form).toBeTruthy();
      const title = screen.getAllByText("Envoyer une note de frais")
      expect(title).toBeTruthy();
    });

    describe("When I upload an image with the valid format", () => {
      test("The input should contain the file", async () => {
        document.body.innerHTML = NewBillUI();

        const NewBillClass = new NewBill({
          document,
          onNavigate,
          store: store,
          localStorage: window.localStorage,
        });

        const handleChangeFile = jest.spyOn(NewBillClass, "handleChangeFile");

        const fileInput = screen.getByTestId("file");
        const file = new File(["file"], "example.jpg", {
          type: "image/jpg",
        });

        fileInput.addEventListener("change", handleChangeFile);
        userEvent.upload(fileInput, file);

        expect(handleChangeFile).toHaveBeenCalled();
        expect(fileInput.files[0]).toStrictEqual(file);
      });
    });

    describe("When I upload an image with the wrong format", () => {
      test("Then the input value should be an empty string", async () => {
        document.body.innerHTML = NewBillUI();

        const NewBillClass = new NewBill({
          document,
          onNavigate,
          store: store,
          localStorage: window.localStorage,
        });

        const handleChangeFile = jest.spyOn(NewBillClass, "handleChangeFile");

        const fileInput = screen.getByTestId("file");
        const file = new File(["file"], "example.jpog", {
          type: "image/jpog",
        });

        fileInput.addEventListener("change", handleChangeFile);
        userEvent.upload(fileInput, file);

        expect(handleChangeFile).toHaveBeenCalled();
        expect(fileInput.value).toStrictEqual('')
      });
    })

    describe("When the form is submitted", () => {
      test("Then handleSubmit is called and updateBill is called with new bill as parameter", async () => {
        document.body.innerHTML = NewBillUI();

        const NewBillClass = new NewBill({
          document,
          onNavigate,
          store: store,
          localStorage: window.localStorage,
        });
        const handleSubmit = jest.spyOn(NewBillClass, "handleSubmit");
        const updateBill = jest.spyOn(NewBillClass, "updateBill");

        const getMockedList = await store.bills().list();
        const mockedList = getMockedList[0];

        NewBillClass.updateBill(mockedList);

        const submitButton = screen.getByTestId("form-new-bill");
        submitButton.addEventListener("click", handleSubmit);
        userEvent.click(submitButton);

        expect(handleSubmit).toHaveBeenCalled();
        expect(updateBill).toHaveBeenCalledWith(
          expect.objectContaining(mockedList)
        );
      });
      test("Then fetch failed with 404 error", async () => {
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
  
      test("Then fetch failed with 505 error", async () => {
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
    });
  })
})