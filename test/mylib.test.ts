import { expect } from 'chai';
import Add, {Add as B} from '../mylib-index.js';
import {describe, it} from 'mocha';
describe("test", () => {
    it("should execute A", async () => {
      expect(await Add.add(1, 2)).equal(3);
    }); //.timeout(100000);

    it("should execute B.add", async () => {
        expect(await B.add(1, 2)).equal(3);
    });
});