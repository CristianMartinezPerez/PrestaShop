require('module-alias/register');

const {expect} = require('chai');

// Import utils
const helper = require('@utils/helpers');
const loginCommon = require('@commonTests/loginBO');

// Import pages
const dashboardPage = require('@pages/BO/dashboard');
const emailPage = require('@pages/BO/advancedParameters/email');
const foLoginPage = require('@pages/FO/login');
const homePage = require('@pages/FO/home');
const productPage = require('@pages/FO/product');
const cartPage = require('@pages/FO/cart');
const checkoutPage = require('@pages/FO/checkout');
const orderConfirmationPage = require('@pages/FO/checkout/orderConfirmation');

// Import data
const {PaymentMethods} = require('@data/demo/paymentMethods');
const {DefaultAccount} = require('@data/demo/customer');

// Import test context
const testContext = require('@utils/testContext');

const baseContext = 'functional_BO_advancedParameters_email_sortAndPagination';

let browserContext;
let page;

let numberOfEmails = 0;

/*
Create 10 orders to have 20 emails
Pagination
Sort by Id, Recipient, Template, Language, Subject, Send
 */
describe('Sort and pagination emails', async () => {
  // before and after functions
  before(async function () {
    browserContext = await helper.createBrowserContext(this.browser);
    page = await helper.newTab(browserContext);
  });

  after(async () => {
    await helper.closeBrowserContext(browserContext);
  });

  it('should login in BO', async function () {
    await loginCommon.loginBO(this, page);
  });

  it('should go to FO page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToFO', baseContext);

    // Click on view my shop
    page = await dashboardPage.viewMyShop(page);

    // Change language on FO
    await homePage.changeLanguage(page, 'en');

    const isHomePage = await homePage.isHomePage(page);
    await expect(isHomePage, 'Fail to open FO home page').to.be.true;
  });

  // 1 - Create 11 orders to have 22 emails in the list
  const tests = new Array(11).fill(0, 0, 11);

  tests.forEach((test, index) => {
    describe(`Create order n°${index + 1} to have email logs`, async () => {
      it('should go to login page', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'goToLoginFO', baseContext);

        await homePage.goToLoginPage(page);

        const pageTitle = await foLoginPage.getPageTitle(page);
        await expect(pageTitle, 'Fail to open FO login page').to.contains(foLoginPage.pageTitle);
      });

      it('should sign in with default customer', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'sighInFO', baseContext);

        await foLoginPage.customerLogin(page, DefaultAccount);

        const isCustomerConnected = await foLoginPage.isCustomerConnected(page);
        await expect(isCustomerConnected, 'Customer is not connected').to.be.true;
      });

      it('should create an order', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'createOrder', baseContext);

        // Go to home page
        await foLoginPage.goToHomePage(page);

        // Go to the first product page
        await homePage.goToProductPage(page, 1);

        // Add the created product to the cart
        await productPage.addProductToTheCart(page);

        // Proceed to checkout the shopping cart
        await cartPage.clickOnProceedToCheckout(page);

        // Address step - Go to delivery step
        const isStepAddressComplete = await checkoutPage.goToDeliveryStep(page);
        await expect(isStepAddressComplete, 'Step Address is not complete').to.be.true;

        // Delivery step - Go to payment step
        const isStepDeliveryComplete = await checkoutPage.goToPaymentStep(page);
        await expect(isStepDeliveryComplete, 'Step Address is not complete').to.be.true;

        // Payment step - Choose payment step
        await checkoutPage.choosePaymentAndOrder(page, PaymentMethods.wirePayment.moduleName);

        // Check the confirmation message
        const cardTitle = await orderConfirmationPage.getOrderConfirmationCardTitle(page);
        await expect(cardTitle).to.contains(orderConfirmationPage.orderConfirmationCardTitle);
      });

      it('should sign out from FO', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'sighOutFO', baseContext);

        await orderConfirmationPage.logout(page);
        const isCustomerConnected = await orderConfirmationPage.isCustomerConnected(page);
        await expect(isCustomerConnected, 'Customer is connected').to.be.false;
      });
    });
  });

  // 4 - Delete all emails
  describe('Delete emails by bulk action', async () => {
    it('should go to \'Advanced parameters > E-mail\' page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToEmailPage', baseContext);

      page = await orderConfirmationPage.closePage(browserContext, page, 0);

      await dashboardPage.goToSubMenu(
        page,
        dashboardPage.advancedParametersLink,
        dashboardPage.emailLink,
      );

      const pageTitle = await emailPage.getPageTitle(page);
      await expect(pageTitle).to.contains(emailPage.pageTitle);
    });

    it('should delete all emails', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'BulkDelete', baseContext);

      const deleteTextResult = await emailPage.deleteEmailLogsBulkActions(page);
      await expect(deleteTextResult).to.be.equal(emailPage.successfulMultiDeleteMessage);
    });
  });
});
