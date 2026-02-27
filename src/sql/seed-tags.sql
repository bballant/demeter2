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
  (13, 'Uncategorized'),
  (14, 'Charity'),
  (15, 'Work');

-- Tag each record by first matching category (order matters)
INSERT INTO record_tag (record_id, tag_id)
SELECT
  r.id,
  CASE
    -- Ordering In (delivery, takeout)
    WHEN UPPER(r.description) LIKE '%DOORDASH%' OR UPPER(r.description) LIKE '%UBER EATS%'
      OR UPPER(r.description) LIKE '%CHIPOTLE%' OR UPPER(r.description) LIKE '%SHAKE SHACK%'
      OR UPPER(r.description) LIKE '%ROMAN GOURMET%' OR UPPER(r.description) LIKE '%SEAMLSS%'
      OR UPPER(r.description) LIKE '%FIVE GUYS%' OR UPPER(r.description) LIKE '%ARIYOSHI JAPANESE%'
      OR UPPER(r.description) LIKE '%SQ *GORILLA CHEESE%' OR UPPER(r.description) LIKE '%SQ *KISSAI%'
      OR UPPER(r.description) LIKE '%SQ *SONNY%BAGEL%' OR UPPER(r.description) LIKE '%SQ *THREE DAUGHTERS%' THEN 5
    -- Wine & Beer
    WHEN UPPER(r.description) LIKE '%LUMS CELLAR%' OR UPPER(r.description) LIKE '%VILLAGE WINE SHOP%'
      OR UPPER(r.description) LIKE '%BUY-RITE%' OR UPPER(r.description) LIKE '%BOLERO SNORT%'
      OR UPPER(r.description) LIKE '%NEIGHBORSWINESHOP%' OR UPPER(r.description) LIKE '%BOTTLE CROWN LIQUORS%'
      OR UPPER(r.description) LIKE '%JOE CANAL%' THEN 2
    -- Groceries
    WHEN UPPER(r.description) LIKE '%STOP & SHOP%' OR UPPER(r.description) LIKE '%TRADER JOE%'
      OR UPPER(r.description) LIKE '%SHOPRITE%' OR UPPER(r.description) LIKE '%GREENWAY MARKET%'
      OR UPPER(r.description) LIKE '%FRESH DIRECT%' OR UPPER(r.description) LIKE '%FDH*FRESH DIRECT%'
      OR UPPER(r.description) LIKE '%FOOD EMPORIUM%' OR UPPER(r.description) LIKE '%WM.COM%'
      OR (UPPER(r.description) LIKE '%COSTCO%' AND UPPER(r.description) NOT LIKE '%ANNUAL RENEWAL%')
      OR UPPER(r.description) LIKE '%7-ELEVEN%' OR UPPER(r.description) LIKE '%WAWA %'
      OR UPPER(r.description) LIKE '%STEWARTS SHOP%' OR UPPER(r.description) LIKE '%STEWART%SHOP%'
      OR UPPER(r.description) LIKE '%WHOLEFDS%' OR UPPER(r.description) LIKE '%PUBLIX%' THEN 1
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
      OR UPPER(r.description) LIKE '%ATT%BILL%' OR UPPER(r.description) LIKE '%COSTCO%ANNUAL RENEWAL%'
      OR UPPER(r.description) LIKE '%1PASSWORD%' OR UPPER(r.description) LIKE '%VZWRLSS%'
      OR UPPER(r.description) LIKE '%B&N MEMBERSHIP RENEWAL%' OR UPPER(r.description) LIKE '%GOOGLE*PLAY%'
      OR UPPER(r.description) LIKE '%MUNICIPAY%' THEN 3
    -- Car & Gas
    WHEN UPPER(r.description) LIKE '%GEICO%' OR UPPER(r.description) LIKE '%PHILLIPS 66%'
      OR UPPER(r.description) LIKE '%NJ EZPASS%' OR UPPER(r.description) LIKE '%EZPASS%'
      OR UPPER(r.description) LIKE '%GATOR MIKE%' OR UPPER(r.description) LIKE '%MAPLEWOOD TIRE%'
      OR UPPER(r.description) LIKE '%SUNOCO%' OR UPPER(r.description) LIKE '%SHELL %'
      OR UPPER(r.description) LIKE '%EXXON%' OR UPPER(r.description) LIKE '%MOBIL %'
      OR UPPER(r.description) LIKE '%VALERO%' OR UPPER(r.description) LIKE '%MAPLEWOOD DELTA%'
      OR UPPER(r.description) LIKE '%ADVANCE AUTO PARTS%' OR UPPER(r.description) LIKE '%SHEETZ%' THEN 4
    -- Transit
    WHEN UPPER(r.description) LIKE '%MTA%' OR UPPER(r.description) LIKE '%NYCT PAYGO%'
      OR UPPER(r.description) LIKE '%NJT RAIL%' OR UPPER(r.description) LIKE '%NJ TRANSIT%'
      OR UPPER(r.description) LIKE '%LYFT%' OR UPPER(r.description) LIKE '%UBER%TRIP%'
      OR UPPER(r.description) LIKE '%UBER CASH%' OR UPPER(r.description) LIKE '%PARKING%'
      OR UPPER(r.description) LIKE '%NEWTAXIPASS%' OR UPPER(r.description) LIKE '%CURB NYC%'
      OR UPPER(r.description) LIKE '%HARRISON%PARKING%' OR UPPER(r.description) LIKE '%PAYPAL *UBER%'
      OR UPPER(r.description) LIKE '%EXPEDIA%' OR UPPER(r.description) LIKE '%UA INFLT%'
      OR UPPER(r.description) LIKE '%UNITED.COM%' OR UPPER(r.description) LIKE '%UNITED   %' OR UPPER(r.description) LIKE '%HERTZ CAR RENTAL%'
      OR UPPER(r.description) LIKE '%HERTZTOLL%' OR UPPER(r.description) LIKE '%SAWYER* BOOKING%'
      OR UPPER(r.description) LIKE '%HAMPTON INN%' OR UPPER(r.description) LIKE '%RSW BEACHES%'
      OR UPPER(r.description) LIKE '%SUNSEEKER RESORTS%' OR UPPER(r.description) LIKE '%VIA CORD%'
      OR UPPER(r.description) LIKE '%MPA STREET METERS%' OR UPPER(r.description) LIKE '%TELECHARGE%' THEN 7
    -- Pets
    WHEN UPPER(r.description) LIKE '%CHEWY%' OR UPPER(r.description) LIKE '%PETSMART%'
      OR UPPER(r.description) LIKE '%PETS BEST%' OR UPPER(r.description) LIKE '%SOUTHORANGEANIMAL%'
      OR UPPER(r.description) LIKE '%VETCOVE%' THEN 8
    -- Healthcare
    WHEN UPPER(r.description) LIKE '%ATLANTIC MEDICAL%' OR UPPER(r.description) LIKE '%DOWNTOWN PSYCHOLOGICAL%'
      OR UPPER(r.description) LIKE '%MDS THERAPY%' OR UPPER(r.description) LIKE '%CARTER SMILE%'
      OR UPPER(r.description) LIKE '%RIVIA MEDICAL%' OR UPPER(r.description) LIKE '%SQ *RIVIA%'
      OR UPPER(r.description) LIKE '%NJ DEPARTMENT OF HEALT%' OR UPPER(r.description) LIKE '%ELEVATION HOLISTICS%'
      OR UPPER(r.description) LIKE '%ATLANTIC IMAGING%' OR UPPER(r.description) LIKE '%MAPLEWOOD VILLAGE OPTI%'
      OR UPPER(r.description) LIKE '%CORDONA ODPA%' OR UPPER(r.description) LIKE '%MARIA I CORDONA%' THEN 9
    -- Going Out (dining, coffee, entertainment venues)
    WHEN UPPER(r.description) LIKE '%TST*%' OR UPPER(r.description) LIKE '%TST *%'
      OR UPPER(r.description) LIKE '%SQ *BAGEL%'
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
      OR UPPER(r.description) LIKE '%PAYPAL *GRUMPY BOBS%'
      OR UPPER(r.description) LIKE '%BENIHANA%' OR UPPER(r.description) LIKE '%CKE*%'
      OR UPPER(r.description) LIKE '%DAVES HOT CHICKEN%'
      OR UPPER(r.description) LIKE '%GREAT AMER BAGEL%' OR UPPER(r.description) LIKE '%HAWKSMOOR%'
      OR UPPER(r.description) LIKE '%MACHO NACHO%' OR UPPER(r.description) LIKE '%PASTIS %'
      OR UPPER(r.description) LIKE '%PRET A MANGER%' OR UPPER(r.description) LIKE '%VILLAGE TRATTORIA%'
      OR UPPER(r.description) LIKE '%SQ *WHEELHOUSE%' OR UPPER(r.description) LIKE '%SQ *HARBORSIDE COFFEE%'
      OR UPPER(r.description) LIKE '%SQ *BACKYARD CINEMAS%' OR UPPER(r.description) LIKE '%EWR SMOKEHOUSE%'
      OR UPPER(r.description) LIKE '%VALLEY VENDING%' OR UPPER(r.description) LIKE '%2CAFES%'
      OR UPPER(r.description) LIKE '%KALAHARI %' OR UPPER(r.description) LIKE '%LAFF OUT LOUD%' OR UPPER(r.description) LIKE '%ENRITE %' THEN 6
    WHEN UPPER(r.description) LIKE '%STARBUCKS%' OR UPPER(r.description) LIKE '%AUNTIE ANNE%'
      OR UPPER(r.description) LIKE '%DUNKIN%' OR UPPER(r.description) LIKE '%INDIGO COFFEE%' THEN 6
    WHEN UPPER(r.description) LIKE '%AMC %' OR UPPER(r.description) LIKE '%YESTERCADES%'
      OR UPPER(r.description) LIKE '%CLAIRIDGE THEATER%' THEN 6
    -- Home (improvement, utilities, lawn, postage)
    WHEN UPPER(r.description) LIKE '%LOWES%' OR UPPER(r.description) LIKE '%HOME DEPOT%'
      OR UPPER(r.description) LIKE '%STAPLES%' OR UPPER(r.description) LIKE '%VIVINT%'
      OR UPPER(r.description) LIKE '%USPS %' OR UPPER(r.description) LIKE '%TOWNSHIP OF SOUTH ORAN%'
      OR UPPER(r.description) LIKE '%SAVATREE%' OR UPPER(r.description) LIKE '%TOWNSHIP OF MAPLEWOOD%'
      OR UPPER(r.description) LIKE '%SAMS AIR CONTROL%' OR UPPER(r.description) LIKE '%VILLAGE GREEN NJ%'
      OR UPPER(r.description) LIKE '%RUSSO BROS%' OR UPPER(r.description) LIKE '%SQ *MILLSTONE LAWN%'
      OR UPPER(r.description) LIKE '%PP*COMMUNITYPASS%' OR UPPER(r.description) LIKE '%PP*SOUTH ORANGE MAPLEW%'
      OR UPPER(r.description) LIKE '%NYX*%ELECTRI%' OR UPPER(r.description) LIKE '%FRIGIDAIRE.COM%'
      OR UPPER(r.description) LIKE '%PAYPAL *ELECTROLUX%'
      OR UPPER(r.description) LIKE '%INTUIT *TURBOTAX%' OR UPPER(r.description) LIKE '%IKEA%' THEN 11
    -- Work (coworking, etc.)
    WHEN UPPER(r.description) LIKE '%MAPLEWOOD COWORK%' THEN 15
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
      OR UPPER(r.description) LIKE '%DSW %'
      OR UPPER(r.description) LIKE '%OLD NAVY%' OR UPPER(r.description) LIKE '%LENOVO%'
      OR UPPER(r.description) LIKE '%WALMART%'
      OR UPPER(r.description) LIKE '%SP ROWAN INC%' OR UPPER(r.description) LIKE '%ROWAN INC%'
      OR UPPER(r.description) LIKE '%PAYPAL *EBAY%' OR UPPER(r.description) LIKE '%PAYPAL *THRIFTBOOKS%'
      OR UPPER(r.description) LIKE '%PAYPAL *MOFT%' OR UPPER(r.description) LIKE '%MFTKNITWEAR%'
      OR UPPER(r.description) LIKE '%NEEDLESKEIN%' OR UPPER(r.description) LIKE '%MOMA DESIGN STORE%'
      OR UPPER(r.description) LIKE '%NORDSTROM%' OR UPPER(r.description) LIKE '%SQ *GENERAL STORE%'
      OR UPPER(r.description) LIKE '%PAYPAL *YOUTHNETINC%' OR UPPER(r.description) LIKE '%HATCHBABY%'
      OR UPPER(r.description) LIKE '%BOSECORPORA%' OR UPPER(r.description) LIKE '%BRICK LLC%'
      OR UPPER(r.description) LIKE '%PAYPAL *PAPIER%' OR UPPER(r.description) LIKE '%MEUSSHOP%'
      OR UPPER(r.description) LIKE '%PRIMARY.COM%' OR UPPER(r.description) LIKE '%BRITTO WORLD%'
      OR UPPER(r.description) LIKE '%GOOD MERCH ONLY%' OR UPPER(r.description) LIKE '%MIOKIISHOP%'
      OR UPPER(r.description) LIKE '%DUANE READE%' OR UPPER(r.description) LIKE '%LULULEMON%'
      OR UPPER(r.description) LIKE '%NEIMAN MARCUS%' OR UPPER(r.description) LIKE '%CRATE & BARREL%'
      OR UPPER(r.description) LIKE '%CONTAINER STORE%' OR UPPER(r.description) LIKE '%CONTAINERSTORE%' OR UPPER(r.description) LIKE '%PAPERSOURCE%'
      OR UPPER(r.description) LIKE '%SPIRIT HALLOWEEN%' OR UPPER(r.description) LIKE '%OLDNAVY.COM%'
      OR UPPER(r.description) LIKE '%DSW.%' OR UPPER(r.description) LIKE '%PAYPAL *1800FLOWERS%'
      OR UPPER(r.description) LIKE '%PAYPAL *BANANAREPUB%' OR UPPER(r.description) LIKE '%PAYPAL *CHURCHMOUSE%'
      OR UPPER(r.description) LIKE '%PAYPAL *TACTICS%' OR UPPER(r.description) LIKE '%PAYPAL *SOCCER COM%'
      OR UPPER(r.description) LIKE '%PAYPAL *DICKSSPORTI%' OR UPPER(r.description) LIKE '%PAYPAL *GOODR%'
      OR UPPER(r.description) LIKE '%PAYPAL *TEEPUBLIC%' OR UPPER(r.description) LIKE '%PAYPAL *SKATE WARE%'
      OR UPPER(r.description) LIKE '%PAYPAL *HOLABIRD%' OR UPPER(r.description) LIKE '%PAYPAL *WESTKNITS%'
      OR UPPER(r.description) LIKE '%PAYPAL *PETITEKNIT%' OR UPPER(r.description) LIKE '%PAYPAL *PRUSADEVELO%'
      OR UPPER(r.description) LIKE '%PAYPAL *CUSTOMMERCH%' OR UPPER(r.description) LIKE '%PAYPAL *DESIGNSJOJI%'
      OR UPPER(r.description) LIKE '%PAYPAL *HELENSTEWAR%' OR UPPER(r.description) LIKE '%PAYPAL *KR MERCH%'
      OR UPPER(r.description) LIKE '%ABEBOOKS%' OR UPPER(r.description) LIKE '%WHSMITH%'
      OR UPPER(r.description) LIKE '%LUMIE SALON%' OR UPPER(r.description) LIKE '%LEO NAILS%'
      OR UPPER(r.description) LIKE '%HAPWARDS TENNIS%' OR UPPER(r.description) LIKE '%EVERYTHING BUT WATER%'
      OR UPPER(r.description) LIKE '%STONY HILL GARDENS%' OR UPPER(r.description) LIKE '%PAYPAL *REPLACEMENT%'
      OR UPPER(r.description) LIKE '%TKO VAPE%'
      OR UPPER(r.description) LIKE '%YARNLIVING%' THEN 10
    -- Entertainment (games, music lessons, kids activities)
    WHEN UPPER(r.description) LIKE '%STEAM GAMES%' OR UPPER(r.description) LIKE '%NINTENDO%'
      OR UPPER(r.description) LIKE '%ELEFANTE MUSIC%' OR UPPER(r.description) LIKE '%BRITISH SWIM SCHOOL%'
      OR UPPER(r.description) LIKE '%MAPLEWOOD RECREATION%' OR UPPER(r.description) LIKE '%WRITERS CIRCLE%'
      OR UPPER(r.description) LIKE '%LOCAL YARN%' OR UPPER(r.description) LIKE '%PURL SOHO%'
      OR UPPER(r.description) LIKE '%VARSITY YEARBOOK%' OR UPPER(r.description) LIKE '%GOTHAM FC%'
      OR UPPER(r.description) LIKE '%NYCOMICCON%' OR UPPER(r.description) LIKE '%THIRTEEN %'
      OR UPPER(r.description) LIKE '%BAZAAR TRADER GAMES%' OR UPPER(r.description) LIKE '%JERRYS ARTIST%'
      OR UPPER(r.description) LIKE '%VILLAGE ICE CREAM%'
      OR UPPER(r.description) LIKE '%RULFS ORCHARD%' OR UPPER(r.description) LIKE '%LORS SCHOOL PORTRAITS%'
      OR UPPER(r.description) LIKE '%SP THE KILLERS%' OR UPPER(r.description) LIKE '%TOP GOLF%'
      OR UPPER(r.description) LIKE '%SHAKESPEARE THEATR%' OR UPPER(r.description) LIKE '%MONTCLAIR FILM FEST%'
      OR UPPER(r.description) LIKE '%REDBULLARENACON%' OR UPPER(r.description) LIKE '%PP*KICKS N STICKS%'
      OR UPPER(r.description) LIKE '%BRAZILIANSOCCERACADEMY%' OR UPPER(r.description) LIKE '%GARDEN STATE TC%'
      OR UPPER(r.description) LIKE '%PAYPAL *G2A%' OR UPPER(r.description) LIKE '%KWS AGE CHECK%'
      OR UPPER(r.description) LIKE '%PP*HUMBLEBUNDL%' OR UPPER(r.description) LIKE '%PAYPAL *ITCH IO%'
      OR UPPER(r.description) LIKE '%PAYPAL *TICKETMASTER%' OR UPPER(r.description) LIKE '%BANDCAMPPARTISANRECOR%'
      OR UPPER(r.description) LIKE '%VITAL EVENT RECORDS%' OR UPPER(r.description) LIKE '%PAYPAL *CMYK GAMES%'
      OR UPPER(r.description) LIKE '%PAYPAL *JERRYSARTAR%' OR UPPER(r.description) LIKE '%PAPER HAT ART%'
      OR UPPER(r.description) LIKE '%LS HEROS WELCOME%' OR UPPER(r.description) LIKE '%LS THE BLUE PURL%' OR UPPER(r.description) LIKE '%BLUE PURL%'
      OR UPPER(r.description) LIKE '%COPPERFISH BOOKS%' OR UPPER(r.description) LIKE '%SQ *FUNNY.CUTE%'
      OR UPPER(r.description) LIKE '%SQ *BUBBLES AND BATH%' OR UPPER(r.description) LIKE '%SQ *PIEBALD%'
      OR UPPER(r.description) LIKE '%SQ *THEATRE REFRESH%' OR UPPER(r.description) LIKE '%FANTASY PARTY WORLD%'
      OR UPPER(r.description) LIKE '%DNCSS %' THEN 12
    -- Charity (donations)
    WHEN UPPER(r.description) LIKE '%ACTBLUE%' OR UPPER(r.description) LIKE '%COMMUNITY FOODBANK%'
      OR UPPER(r.description) LIKE '%DOCTORSWITHOUTBORDERS%' OR UPPER(r.description) LIKE '%GB* %'
      OR UPPER(r.description) LIKE '%GIVEBUTTER%' OR UPPER(r.description) LIKE '%GOFNDME%'
      OR UPPER(r.description) LIKE '%WOMENS FDN%' OR UPPER(r.description) LIKE '%WFMN.ORG%' THEN 14
    -- Default
    ELSE 13
  END
FROM record r;
