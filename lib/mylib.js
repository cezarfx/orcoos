//'use strict';

class Add {
    static async add(x/*: number*/, y/*: number*/)/*: number*/ {
        return x + y;
    }        
}

export {Add};
//module.exports.Add = Add;

// Works
// export class Add {
//     static async add(x/*: number*/, y/*: number*/)/*: number*/ {
//         return x + y;
//     }        
// }

// class Add {
//     static async add(x/*: number*/, y/*: number*/)/*: number*/ {
//         return x + y;
//     }        
// }
// export {Add};

// class Add {
//     static async add(x/*: number*/, y/*: number*/)/*: number*/ {
//         return x + y;
//     }        
// }
// module.exports.Add = Add;