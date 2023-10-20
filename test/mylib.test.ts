import { expect } from 'chai';
import Add, {Add as B} from '../mylib-index.js';


describe("Main test", () => {
    it("should execute add", async () => {
      expect(await Add.add(1, 2)).equal(3);
    }); //.timeout(100000);

    it("should execute add", async () => {
        expect(await B.add(1, 2)).equal(3);
    });
});