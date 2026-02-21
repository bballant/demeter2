-- Seed category tags and tag every record by description patterns.
-- Run with: demeter2 db execute path/to/seed-tags.sql
-- Idempotent: clears tag/record_tag first so re-run is safe.

DELETE FROM record_tag;
DELETE FROM tag;

-- Tag names (fixed ids for stable references)
INSERT INTO tag (id, name) VALUES
  (1, 'Groceries'),
  (2, 'Wine & Beer'),
  (3, 'Subscriptions'),
  (4, 'Car & Gas'),
  (5, 'Ordering In'),
  (6, 'Going Out'),
  (7, 'Transit'),
  (8, 'Pets'),
  (9, 'Healthcare'),
  (10, 'Shopping'),
  (11, 'Home'),
  (12, 'Entertainment'),
  (13, 'Uncategorized');

-- Tag each record by first matching category (order matters)
INSERT INTO record_tag (record_id, tag_id)
SELECT
  r.id,
  CASE
    -- Ordering In (delivery)
    WHEN UPPER(r.description) LIKE '%DOORDASH%' OR UPPER(r.description) LIKE '%UBER EATS%' THEN 5
    -- Wine & Beer
    WHEN UPPER(r.description) LIKE '%LUMS CELLAR%' OR UPPER(r.description) LIKE '%VILLAGE WINE SHOP%'
      OR UPPER(r.description) LIKE '%BUY-RITE%' OR UPPER(r.description) LIKE '%BOLERO SNORT%'
      OR UPPER(r.description) LIKE '%NEIGHBORSWINESHOP%' THEN 2
    -- Groceries
    WHEN UPPER(r.description) LIKE '%STOP & SHOP%' OR UPPER(r.description) LIKE '%TRADER JOE%'
      OR UPPER(r.description) LIKE '%SHOPRITE%' OR UPPER(r.description) LIKE '%GREENWAY MARKET%'
      OR UPPER(r.description) LIKE '%FRESH DIRECT%' OR UPPER(r.description) LIKE '%FDH*FRESH DIRECT%'
      OR UPPER(r.description) LIKE '%FOOD EMPORIUM%' OR UPPER(r.description) LIKE '%WM.COM%'
      OR (UPPER(r.description) LIKE '%COSTCO%' AND UPPER(r.description) NOT LIKE '%ANNUAL RENEWAL%')
      OR UPPER(r.description) LIKE '%7-ELEVEN%' OR UPPER(r.description) LIKE '%WAWA %'
      OR UPPER(r.description) LIKE '%STEWARTS SHOP%' OR UPPER(r.description) LIKE '%STEWART%SHOP%' THEN 1
    -- Subscriptions (streaming, software, recurring)
    WHEN UPPER(r.description) LIKE '%SPOTIFY%' OR UPPER(r.description) LIKE '%PARAMOUNT+%'
      OR UPPER(r.description) LIKE '%PELOTON%' OR UPPER(r.description) LIKE '%OPENAI%'
      OR UPPER(r.description) LIKE '%CHATGPT%' OR UPPER(r.description) LIKE '%DISNEY PLUS%'
      OR UPPER(r.description) LIKE '%HULU%' OR UPPER(r.description) LIKE '%HLU%'
      OR UPPER(r.description) LIKE '%NETFLIX%' OR UPPER(r.description) LIKE '%PLAYSTATION NETWORK%'
      OR UPPER(r.description) LIKE '%GOOGLE ONE%' OR UPPER(r.description) LIKE '%MICROSOFT%MICROSOFT 36%'
      OR UPPER(r.description) LIKE '%MICROSOFT 36%' OR UPPER(r.description) LIKE '%ADOBE%'
      OR UPPER(r.description) LIKE '%AUDIBLE%' OR UPPER(r.description) LIKE '%BOOKOFMONTH%'
      OR UPPER(r.description) LIKE '%CONDE NAST%' OR UPPER(r.description) LIKE '%ANTHROPIC%'
      OR UPPER(r.description) LIKE '%REMARKABLE%' OR UPPER(r.description) LIKE '%GABB WIRELESS%'
      OR UPPER(r.description) LIKE '%ATT%BILL%' OR UPPER(r.description) LIKE '%COSTCO%ANNUAL RENEWAL%' THEN 3
    -- Car & Gas
    WHEN UPPER(r.description) LIKE '%GEICO%' OR UPPER(r.description) LIKE '%PHILLIPS 66%'
      OR UPPER(r.description) LIKE '%NJ EZPASS%' OR UPPER(r.description) LIKE '%EZPASS%'
      OR UPPER(r.description) LIKE '%GATOR MIKE%' OR UPPER(r.description) LIKE '%MAPLEWOOD TIRE%'
      OR UPPER(r.description) LIKE '%SUNOCO%' OR UPPER(r.description) LIKE '%SHELL %'
      OR UPPER(r.description) LIKE '%EXXON%' OR UPPER(r.description) LIKE '%MOBIL %'
      OR UPPER(r.description) LIKE '%VALERO%' OR UPPER(r.description) LIKE '%MAPLEWOOD DELTA%' THEN 4
    -- Transit
    WHEN UPPER(r.description) LIKE '%MTA%' OR UPPER(r.description) LIKE '%NYCT PAYGO%'
      OR UPPER(r.description) LIKE '%NJT RAIL%' OR UPPER(r.description) LIKE '%NJ TRANSIT%'
      OR UPPER(r.description) LIKE '%LYFT%' OR UPPER(r.description) LIKE '%UBER%TRIP%'
      OR UPPER(r.description) LIKE '%UBER CASH%' OR UPPER(r.description) LIKE '%PARKING%'
      OR UPPER(r.description) LIKE '%NEWTAXIPASS%' OR UPPER(r.description) LIKE '%CURB NYC%'
      OR UPPER(r.description) LIKE '%HARRISON%PARKING%' THEN 7
    -- Pets
    WHEN UPPER(r.description) LIKE '%CHEWY%' OR UPPER(r.description) LIKE '%PETSMART%'
      OR UPPER(r.description) LIKE '%PETS BEST%' THEN 8
    -- Healthcare
    WHEN UPPER(r.description) LIKE '%ATLANTIC MEDICAL%' OR UPPER(r.description) LIKE '%DOWNTOWN PSYCHOLOGICAL%'
      OR UPPER(r.description) LIKE '%MDS THERAPY%' OR UPPER(r.description) LIKE '%CARTER SMILE%'
      OR UPPER(r.description) LIKE '%RIVIA MEDICAL%' OR UPPER(r.description) LIKE '%SQ *RIVIA%'
      OR UPPER(r.description) LIKE '%NJ DEPARTMENT OF HEALT%' OR UPPER(r.description) LIKE '%ELEVATION HOLISTICS%' THEN 9
    -- Going Out (dining, coffee, entertainment venues)
    WHEN UPPER(r.description) LIKE '%TST*%' OR UPPER(r.description) LIKE '%TST *%'
      OR UPPER(r.description) LIKE '%CHIPOTLE%' OR UPPER(r.description) LIKE '%ROMAN GOURMET%'
      OR UPPER(r.description) LIKE '%SHAKE SHACK%' OR UPPER(r.description) LIKE '%SQ *BAGEL%'
      OR UPPER(r.description) LIKE '%SQ *THE ABLE BAKER%' OR UPPER(r.description) LIKE '%SQ *PORTA ROSSA%'
      OR UPPER(r.description) LIKE '%SQ *ARTIE%' OR UPPER(r.description) LIKE '%SQ *PALMER%'
      OR UPPER(r.description) LIKE '%HALCYON%' OR UPPER(r.description) LIKE '%CORNER SLICE%'
      OR UPPER(r.description) LIKE '%HEIRLOOM KITCHEN%' OR UPPER(r.description) LIKE '%EATALY%'
      OR UPPER(r.description) LIKE '%SBARRO%' OR UPPER(r.description) LIKE '%GONGCHA%'
      OR UPPER(r.description) LIKE '%REALFRUITBUBBLE%' OR UPPER(r.description) LIKE '%FIV*GONG%'
      OR UPPER(r.description) LIKE '%KALAHARI RESTAURANT%' OR UPPER(r.description) LIKE '%PENDRY%'
      OR UPPER(r.description) LIKE '%TAPPO%' OR UPPER(r.description) LIKE '%ST JAMES%GATE%'
      OR UPPER(r.description) LIKE '%PASTARAMEN%' OR UPPER(r.description) LIKE '%CHINA CHALET%'
      OR UPPER(r.description) LIKE '%OAKLAND RD%' OR UPPER(r.description) LIKE '%BILLY%MIDWAY%'
      OR UPPER(r.description) LIKE '%DEVOCION%' OR UPPER(r.description) LIKE '%KITCHEN STEP%'
      OR UPPER(r.description) LIKE '%SIMPLY SWEET%' OR UPPER(r.description) LIKE '%NAMINORI%'
      OR UPPER(r.description) LIKE '%SOUVLAQUE%' OR UPPER(r.description) LIKE '%BAYLEAF%'
      OR UPPER(r.description) LIKE '%SAIGON CAF%' OR UPPER(r.description) LIKE '%JERRY%FLORIST%'
      OR UPPER(r.description) LIKE '%TLF*JERRY ROSE%' OR UPPER(r.description) LIKE '%FRESH BUBBLE TEA%'
      OR UPPER(r.description) LIKE '%MCDONALD%' OR UPPER(r.description) LIKE '%POPEYES%'
      OR UPPER(r.description) LIKE '%PAYPAL *GRUMPY BOBS%' THEN 6
    WHEN UPPER(r.description) LIKE '%STARBUCKS%' OR UPPER(r.description) LIKE '%AUNTIE ANNE%'
      OR UPPER(r.description) LIKE '%DUNKIN%' OR UPPER(r.description) LIKE '%INDIGO COFFEE%' THEN 6
    WHEN UPPER(r.description) LIKE '%AMC %' OR UPPER(r.description) LIKE '%YESTERCADES%'
      OR UPPER(r.description) LIKE '%CLAIRIDGE THEATER%' THEN 6
    -- Home (improvement, utilities, lawn, postage)
    WHEN UPPER(r.description) LIKE '%LOWES%' OR UPPER(r.description) LIKE '%HOME DEPOT%'
      OR UPPER(r.description) LIKE '%STAPLES%' OR UPPER(r.description) LIKE '%VIVINT%'
      OR UPPER(r.description) LIKE '%USPS %' OR UPPER(r.description) LIKE '%TOWNSHIP OF SOUTH ORAN%'
      OR UPPER(r.description) LIKE '%SAVATREE%' OR UPPER(r.description) LIKE '%TOWNSHIP OF MAPLEWOOD%'
      OR UPPER(r.description) LIKE '%SAMS AIR CONTROL%' OR UPPER(r.description) LIKE '%VILLAGE GREEN NJ%' THEN 11
    -- Shopping (retail, pharmacy, Amazon non-subscription)
    WHEN UPPER(r.description) LIKE '%AMAZON%' OR UPPER(r.description) LIKE '%AMAZON MKTPL%'
      OR UPPER(r.description) LIKE '%AMAZON DIGI%' THEN 10
    WHEN UPPER(r.description) LIKE '%BARNES & NOBLE%' OR UPPER(r.description) LIKE '%BARNES&NOBLE%'
      OR UPPER(r.description) LIKE '%WORDS%BOOKSTORE%' OR UPPER(r.description) LIKE '%INDIGO BOOK%'
      OR UPPER(r.description) LIKE '%MICHAELS%' OR UPPER(r.description) LIKE '%TARGET%'
      OR UPPER(r.description) LIKE '%WALGREENS%' OR UPPER(r.description) LIKE '%CVS%'
      OR UPPER(r.description) LIKE '%MARSHALLS%' OR UPPER(r.description) LIKE '%DICK%SPORTING%'
      OR UPPER(r.description) LIKE '%BESTBUY%' OR UPPER(r.description) LIKE '%BEST BUY%'
      OR UPPER(r.description) LIKE '%PATAGONIA%' OR UPPER(r.description) LIKE '%ETSY%'
      OR UPPER(r.description) LIKE '%ANTHROPOLOGIE%' OR UPPER(r.description) LIKE '%MADEWELL%'
      OR UPPER(r.description) LIKE '%IKEA%' OR UPPER(r.description) LIKE '%DSW %'
      OR UPPER(r.description) LIKE '%OLD NAVY%' OR UPPER(r.description) LIKE '%LENOVO%'
      OR UPPER(r.description) LIKE '%WALMART%' OR UPPER(r.description) LIKE '%MAPLEWOOD COWORK%'
      OR UPPER(r.description) LIKE '%PAYPAL *EBAY%' OR UPPER(r.description) LIKE '%PAYPAL *THRIFTBOOKS%'
      OR UPPER(r.description) LIKE '%PAYPAL *MOFT%' OR UPPER(r.description) LIKE '%MFTKNITWEAR%'
      OR UPPER(r.description) LIKE '%NEEDLESKEIN%' OR UPPER(r.description) LIKE '%MOMA DESIGN STORE%'
      OR UPPER(r.description) LIKE '%NORDSTROM%' OR UPPER(r.description) LIKE '%SQ *GENERAL STORE%'
      OR UPPER(r.description) LIKE '%PAYPAL *YOUTHNETINC%' OR UPPER(r.description) LIKE '%HATCHBABY%'
      OR UPPER(r.description) LIKE '%BOSECORPORA%' OR UPPER(r.description) LIKE '%BRICK LLC%'
      OR UPPER(r.description) LIKE '%PAYPAL *PAPIER%' OR UPPER(r.description) LIKE '%MEUSSHOP%'
      OR UPPER(r.description) LIKE '%PRIMARY.COM%' OR UPPER(r.description) LIKE '%BRITTO WORLD%'
      OR UPPER(r.description) LIKE '%GOOD MERCH ONLY%' OR UPPER(r.description) LIKE '%MIOKIISHOP%'
      OR UPPER(r.description) LIKE '%RUSSO BROS%' THEN 10
    -- Entertainment (games, music lessons, kids activities)
    WHEN UPPER(r.description) LIKE '%STEAM GAMES%' OR UPPER(r.description) LIKE '%NINTENDO%'
      OR UPPER(r.description) LIKE '%ELEFANTE MUSIC%' OR UPPER(r.description) LIKE '%BRITISH SWIM SCHOOL%'
      OR UPPER(r.description) LIKE '%MAPLEWOOD RECREATION%' OR UPPER(r.description) LIKE '%WRITERS CIRCLE%'
      OR UPPER(r.description) LIKE '%LOCAL YARN%' OR UPPER(r.description) LIKE '%PURL SOHO%'
      OR UPPER(r.description) LIKE '%VARSITY YEARBOOK%' OR UPPER(r.description) LIKE '%GOTHAM FC%'
      OR UPPER(r.description) LIKE '%NYCOMICCON%' OR UPPER(r.description) LIKE '%THIRTEEN %'
      OR UPPER(r.description) LIKE '%BAZAAR TRADER GAMES%' OR UPPER(r.description) LIKE '%JERRYS ARTIST%'
      OR UPPER(r.description) LIKE '%VILLAGE ICE CREAM%' OR UPPER(r.description) LIKE '%ROWAN INC%'
      OR UPPER(r.description) LIKE '%RULFS ORCHARD%' OR UPPER(r.description) LIKE '%LORS SCHOOL PORTRAITS%'
      OR UPPER(r.description) LIKE '%SP THE KILLERS%' THEN 12
    -- Default
    ELSE 13
  END
FROM record r;
