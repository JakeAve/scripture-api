# Scripture API

A REST API for finding and formatting scripture references from the canon of the
Church of Jesus Christ of Latter-day Saints.

**Disclaimer: Not an official publication of the Church of Jesus Christ of
Latter-day Saints**

## Features

- Parse and normalize scripture references
- Find references by book, volume, or content
- Retrieve specific verses or chapters
- Serve static assets (favicon, icons)
- CORS enabled

## Endpoints

### Home

- `GET /`
- `GET /v1`

Returns a list of available routes.

**Example:**

```js
{
  "routes": [
    "/",
    "/v1",
    "/v1/find?ref=&book=&volume=&max=",
    "/v1/parse?ref=&content=",
    "/v1/:book/:chapter/:verses",
    "/favicon.ico",
    "/apple-touch-icon.png",
    "/apple-touch-icon-precomposed.png"
  ],
  "meta": {
    "path": "/",
    "search": "",
    "processingTime": "4ms",
    "status": 200
  }
}
```

### Find Reference

- `GET /v1/find?ref=QUERY[&book=BOOK][&volume=VOLUME][&max=NUMBER]`

Finds scripture references matching the query.

**Query Parameters:**

- `ref` (required): The reference string to search for.
- `book` (optional, repeatable): Restrict search to specific book(s).
- `volume` (optional, repeatable): Restrict search to specific volume(s) (`ot`,
  `nt`, `bom`, `dc`, `pgp`) to help with performance
- `start` (default 0) start index
- `end` (default 5) end index, EXCLUDING this index. Example: `start=0&end=5` will be 0, 1, 2, 3, 4

**Examples:**

- `curl "http://localhost:8000/v1/find?ref=for+God+so+loved+the+world"`

```js
{
  "results": [
    {
      "abbr": "John 3:16",
      "api": "/john/3/16",
      "book": {
        "name": "John",
        "abbr": "John"
      },
      "chapter": 3,
      "link": "https://www.churchofjesuschrist.org/study/scriptures/nt/john/3?lang=eng&id=p16#p16",
      "reference": "John 3:16",
      "verses": [16],
      "content": "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
      "match": "FOR GOD SO LOVED THE WORLD"
    },
  // default 5 total results
  ],
  "input": "for God so loved the world",
  "meta": {
    "path": "/v1/find",
    "search": "?ref=for+God+so+loved+the+world",
    "processingTime": "339ms",
    "status": 200
  }
}
```

- `curl "http://localhost:8000/v1/find?ref=small+and+simple&start=0&end=1&book=Alma"`

```js
{
  "results": [
    {
      "abbr": "Alma 37:6",
      "api": "/alma/37/6",
      "book": {
        "name": "Alma",
        "abbr": "Alma"
      },
      "chapter": 37,
      "link": "https://www.churchofjesuschrist.org/study/scriptures/bofm/alma/37?lang=eng&id=p6#p6",
      "reference": "Alma 37:6",
      "verses": [6],
      "content": "Now ye may suppose that this is foolishness in me; but behold I say unto you, that by small and simple things are great things brought to pass; and small means in many instances doth confound the wise.",
      "match": "SMALL AND SIMPLE"
    }
  ],
  "input": "small and simple",
  "meta": {
    "path": "/v1/find",
    "search": "?ref=small+and+simple&max=1&book=Alma",
    "processingTime": "49ms",
    "status": 200
  }
}
```

### Parse Reference

- `GET /v1/parse?ref=QUERY[&content=true]`

Parses a scripture reference and returns structured data.

**Query Parameters:**

- `ref` (required): The reference string to parse.
- `content` (optional): If `true`, includes verse content.

**Examples:**

- `curl "http://localhost:8000/v1/parse?ref=1+nephi+3%3A7"`

```js
{
  "result": {
    "abbr": "1 Ne. 3:7",
    "api": "/1-ne/3/7",
    "book": {
      "name": "1 Nephi",
      "abbr": "1 Ne."
    },
    "chapter": 3,
    "link": "https://www.churchofjesuschrist.org/study/scriptures/bofm/1-ne/3?lang=eng&id=p7#p7",
    "reference": "1 Nephi 3:7",
    "verses": [7]
  },
  "input": "1 nephi 3:7",
  "meta": {
    "path": "/v1/parse",
    "search": "?ref=1+nephi+3%3A7",
    "processingTime": "5ms",
    "status": 200
  }
}
```

- `curl "http://localhost:8000/v1/parse?ref=1+nephi+3%3A7&content=true"`

```js
{
  "result": {
    "abbr": "1 Ne. 3:7",
    "api": "/1-ne/3/7",
    "book": {
      "name": "1 Nephi",
      "abbr": "1 Ne."
    },
    "chapter": 3,
    "link": "https://www.churchofjesuschrist.org/study/scriptures/bofm/1-ne/3?lang=eng&id=p7#p7",
    "reference": "1 Nephi 3:7",
    "verses": [7],
    "content": "And it came to pass that I, Nephi, said unto my father: I will go and do the things which the Lord hath commanded, for I know that the Lord giveth no commandments unto the children of men, save he shall prepare a way for them that they may accomplish the thing which he commandeth them."
  },
  "input": "1 nephi 3:7",
  "meta": {
    "path": "/v1/parse",
    "search": "?ref=1+nephi+3%3A7&content=true",
    "processingTime": "2ms",
    "status": 200
  }
}
```

### Get Scripture Content

- `GET /v1/:book/:chapter`
- `GET /v1/:book/:chapter/:verses`

Retrieves the content for a specific book, chapter, and (optionally) verses.

**Path Parameters:**

- `book`: Book slug (e.g., `gen`, `mosiah`, `dc`).
- `chapter`: Chapter number (or section for D&C).
- `verses` (optional): Verse(s) or range(s), e.g. `5`, `1-3`, `1/3/5-7`.

**Examples:**

- `curl "http://localhost:8000/v1/gen/1/1"`

```js
{
  "content": [
    "In the beginning God created the heaven and the earth."
  ],
  "meta": {
    "path": "/v1/gen/1/1",
    "search": "",
    "processingTime": "1ms",
    "status": 200
  }
}
```

- `curl "http://localhost:8000/v1/mosiah/3/1-5/10-11"`

```js
{
  "content": [
    "And he shall be called Jesus Christ, the Son of God, the Father of heaven and earth, the Creator of all things from the beginning; and his mother shall be called Mary.",
    "And lo, he cometh unto his own, that salvation might come unto the children of men even through faith on his name; and even after all this they shall consider him a man, and say that he hath a devil, and shall scourge him, and shall crucify him.",
    "And he shall rise the third day from the dead; and behold, he standeth to judge the world; and behold, all these things are done that a righteous judgment might come upon the children of men.",
    "For the natural man is an enemy to God, and has been from the fall of Adam, and will be, forever and ever, unless he yields to the enticings of the Holy Spirit, and putteth off the natural man and becometh a saint through the atonement of Christ the Lord, and becometh as a child, submissive, meek, humble, patient, full of love, willing to submit to all things which the Lord seeth fit to inflict upon him, even as a child doth submit to his father.",
    "And moreover, I say unto you, that the time shall come when the knowledge of a Savior shall spread throughout every nation, kindred, tongue, and people.",
    "And now I have spoken the words which the Lord God hath commanded me."
  ],
  "meta": {
    "path": "/v1/mosiah/3/8-10/19-20/23",
    "search": "",
    "processingTime": "0ms",
    "status": 200
  }
}
```

### Static Assets

- `GET /favicon.ico`
- `GET /apple-touch-icon.png`
- `GET /apple-touch-icon-precomposed.png`

## Usage

### Development

```sh
deno task dev
```

### Production

```sh
deno task start
```

## Environment Variables

- `PORT`: Port to run the server on (default: 8000)
- `HOSTNAME`: Hostname to bind (default: 0.0.0.0)
