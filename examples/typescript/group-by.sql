
--  select distinct locations
select distinct t.kvjson."storeLocation" from sales t;

--  select avg customer age and satisfaction
select avg(t.kvjson."customer"."age"), avg(t.kvjson."customer"."satisfaction") from sales t;

--  select sales count, total items quantity sold, avg customer age and satisfaction 
--  per location
select  {
        "location": t.kvjson."storeLocation", 
        "salesCount": count(*),
        "totalQty": sum(t.kvjson."items"[]."quantity"[]),
        "avgCustomer": { 
            "age": avg(t.kvjson."customer"."age"), 
            "satisfation": avg(t.kvjson."customer"."satisfaction")
        }
    } from sales t 
    group by t.kvjson."storeLocation";

--  select sale sums per sale
select t.kvjson."items"[]."price", t.kvjson."items"[]."quantity", 
    seq_transform(t.kvjson."items"[], $."price" * $."quantity"),
    sum(seq_transform(t.kvjson."items"[], $."price" * $."quantity"))
from sales t;   // Error: at (1, 26) Invalid expression in SELECT or ORDER-BY clause. When a SELECT expression includes grouping, expressions in the SELECT and ORDER-BY clauses must reference grouping expressions, aggregate functions or external variable only.

-- total sum of sales
select sum(seq_transform(t.kvjson."items"[], $."price" * $."quantity"))
   from sales t ;

--  sum of sales per location
select t.kvjson."storeLocation",
    sum(seq_transform(t.kvjson."items"[], $."price" * $."quantity"))
from sales t group by t.kvjson."storeLocation";

--  sum of sales per purchaseMethod
select t.kvjson."purchaseMethod",
    sum(seq_transform(t.kvjson."items"[], $."price" * $."quantity"))
from sales t group by t.kvjson."purchaseMethod";

--  sum of sales per customer gender
select t.kvjson."customer"."gender",
    sum(seq_transform(t.kvjson."items"[], $."price" * $."quantity"))
from sales t group by t.kvjson."customer"."gender";

--  avg price per item name
select t.kvjson."items"[]."name"
  from sales t group by t.kvjson."items"[]."name";
Error: at (2, 41) Result set with more than one item cannot be promoted  to type Any?


-- Group by Location: sales count, qty, avg price per item, total sales amt
select
  t.kvjson.storeLocation, 
  count(t.kvjson.storeLocation) as sales_count, 
  sum(t.kvjson.items[].quantity) as total_qty, 
  avg(t.kvjson.items[].price) as avg_price_per_item, 
  sum( seq_transform(t.kvjson."items"[], $."price" * $."quantity") ) as total_sales_amt 
from sales t group by t.kvjson.storeLocation;

-- Group by Location and PurchaseMethod
select
  t.kvjson.storeLocation, 
  t.kvjson.purchaseMethod,
  count(t.kvjson.storeLocation) as sales_count, 
  sum(t.kvjson.items[].quantity) as total_qty, 
  avg(t.kvjson.items[].price) as avg_price_per_item, 
  sum( seq_transform(t.kvjson."items"[], $."price" * $."quantity") ) as total_sales_amt 
from sales t group by t.kvjson.storeLocation, t.kvjson.purchaseMethod;


-- DDL
CREATE TABLE IF NOT EXISTS sales (kvid STRING, kvjson JSON, PRIMARY KEY(SHARD(kvid)));
-- data
insert into sales values ("00001", 
  {"saleDate" : "2023-09-14T19:08:17.098Z",
   "items": [
      { "name": "binder",
        "price": 13.44,
        "quantity": 8
      },
      { "name": "notebook",
        "price": 1.44,
        "quantity": 10
      }
   ],
   "storeLocation": "London",
   "customer": {
      "gender": "M",
      "age": 44,
      "email": "em@ai.l",
      "satisfaction": 2
   },
   "couponUsed" : false,
   "purchaseMethod": "InStore"
  }
);

insert into sales values ("00002", 
  {"saleDate" : "2023-09-16T19:08:17.098Z",
   "items": [
      { "name": "coffee",
        "price": 6.44,
        "quantity": 3
      },
      { "name": "notebook",
        "price": 1.10,
        "quantity": 5
      }
   ],
   "storeLocation": "NY",
   "customer": {
      "gender": "F",
      "age": 34,
      "email": "em2@ai.l",
      "satisfaction": 3
   },
   "couponUsed" : false,
   "purchaseMethod": "InStore"
  }
);

insert into sales values ("00003", 
  {"saleDate" : "2023-09-14T09:18:17.098Z",
   "items": [
      { "name": "coffee",
        "price": 3.44,
        "quantity": 2
      },
      { "name": "milk",
        "price": 3.10,
        "quantity": 2
      }
   ],
   "storeLocation": "NY",
   "customer": {
      "gender": "F",
      "age": 30,
      "email": "em3@ai.l",
      "satisfaction": 2
   },
   "couponUsed" : false,
   "purchaseMethod": "InStore"
  }
);

insert into sales values ("00004", 
  {"saleDate" : "2023-09-14T09:17:17.098Z",
   "items": [
      { "name": "eggs",
        "price": 5.22,
        "quantity": 1
      },
      { "name": "milk",
        "price": 3.10,
        "quantity": 2
      }
   ],
   "storeLocation": "London",
   "customer": {
      "gender": "M",
      "age": 47,
      "email": "em4@ai.l",
      "satisfaction": 4
   },
   "couponUsed" : false,
   "purchaseMethod": "InStore"
  }
);


insert into sales values ("00005", 
  {"saleDate" : "2023-09-14T09:17:17.098Z",
   "items": [
      { "name": "eggs",
        "price": 5.22,
        "quantity": 1
      },
      { "name": "milk",
        "price": 3.10,
        "quantity": 2
      },
      { "name": "coffee",
        "price": 2.10,
        "quantity": 5
      },
      { "name": "bread",
        "price": 4.10,
        "quantity": 1
      }
   ],
   "storeLocation": "Paris",
   "customer": {
      "gender": "M",
      "age": 47,
      "email": "em4@ai.l",
      "satisfaction": 4
   },
   "couponUsed" : false,
   "purchaseMethod": "InStore"
  }
);

insert into sales values ("00006", 
  {"saleDate" : "2023-09-14T09:19:17.098Z",
   "items": [
      { "name": "milk",
        "price": 3.10,
        "quantity": 3
      },
      { "name": "coffee",
        "price": 2.10,
        "quantity": 5
      },
      { "name": "bread",
        "price": 4.10,
        "quantity": 2
      }
   ],
   "storeLocation": "NY",
   "customer": {
      "gender": "M",
      "age": 47,
      "email": "em4@ai.l",
      "satisfaction": 1
   },
   "couponUsed" : false,
   "purchaseMethod": "Online"
  }
);

