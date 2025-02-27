import * as vCard from '../lib/vcard';

describe('vCard.parse', function () {
    it('Should ignore vCard start and end tags', function () {
        const raw = 'BEGIN:VCARD\r\nEND:VCARD',
            card = vCard.parse(raw);

        expect(card).toEqual({});
    });

    it('Should parse simple vcard lines', function () {
        const raw = 'FN:Forrest Gump',
            card = vCard.parse(raw);

        expect(card.fn).toEqual([{value: 'Forrest Gump'}]);
    });

    it('Should parse line with complex properties', function () {
        const raw = 'N:Gump;Forrest;;Mr.;',
            card = vCard.parse(raw);

        expect(card.n).toEqual([{
            value: [
                'Gump', 'Forrest', '', 'Mr.', ''
            ]
        }]);
    });

    it('Should parse vcard with repeated properties', function () {
        const raw = 'FN:Forrest Gump\nFN:Other Gump',
            card = vCard.parse(raw);

        expect(card.fn).toEqual([
            {value: 'Forrest Gump'},
            {value: 'Other Gump'}
        ]);
    });

    it('Should parse line with metadata', function () {
        const raw = 'TEL;TYPE=HOME:78884545247',
            card = vCard.parse(raw);

        expect(card.tel).toEqual([
            {value: '78884545247', meta: {type: ['HOME']}}
        ]);
    });

    it('Should parse line with multiple metadata', function () {
        const raw = 'TEL;TYPE=HOME;PREF=1:78884545247',
            card = vCard.parse(raw);

        expect(card.tel).toEqual([
            {value: '78884545247', meta: {type: ['HOME'], pref: ['1']}}
        ]);
    });

    it('Should parse line with multiple values of one metadata field', function () {
        const raw = 'TEL;TYPE=HOME;TYPE=CELL:78884545247',
            card = vCard.parse(raw);

        expect(card.tel).toEqual([
            {value: '78884545247', meta: {type: ['HOME', 'CELL']}}
        ]);
    });

    it('Should parse line with namespace', function () {
        const raw = 'item1.EMAIL;TYPE=INTERNET:other@email.com',
            card = vCard.parse(raw);

        expect(card.email).toEqual([
            {value: 'other@email.com', namespace: 'item1', meta: {type: ['INTERNET']}}
        ]);
    });

    it('Should parse multiline properties (when first symbol is space)', function () {
        const raw = 'PHOTO;ENCODING=b;TYPE=JPEG:THIS/IS/SHITTY/BASE64\n' +
                ' ENCODED/PHOTO',
            card = vCard.parse(raw);

        expect(card.photo).toEqual([
            {value: 'THIS/IS/SHITTY/BASE64ENCODED/PHOTO', meta: {encoding: ['b'], type: ['JPEG']}}
        ]);
    });

    it('Should parse multiline properties (when first symbol is tab)', function () {
        const raw = 'PHOTO;ENCODING=b;TYPE=JPEG:THIS/IS/SHITTY/BASE64\n' +
                '\tENCODED/PHOTO',
            card = vCard.parse(raw);

        expect(card.photo).toEqual([
            {value: 'THIS/IS/SHITTY/BASE64ENCODED/PHOTO', meta: {encoding: ['b'], type: ['JPEG']}}
        ]);
    });

    it('Should parse properties with \\n symbol', function () {
        const raw = 'BEGIN:VCARD\nADR:Hello\\nmy\\naddress\nEND:VCARD',
            card = vCard.parse(raw);

        expect(card.adr).toEqual([
            {value: 'Hello\nmy\naddress'}
        ]);
    });
    it('Should parse properties with escaped semicolon, colon and backslash symbols', function () {
        const raw = 'ADR:\\1\\;2\\,3\\;;;;;',
            card = vCard.parse(raw);
        expect(card.adr).toEqual([
            {value: ['\\1;2,3;','','','','']}
        ]);
    });
    it('Should parse properties with escaped semicolon, colon and backslash symbols in meta value', function () {
        const raw = 'TEL;TYPE=HO\\;\\,\\ME;PREF=1:78884545247',
            card = vCard.parse(raw);
        expect(card.tel).toEqual([
            {value: '78884545247', meta: {type: ['HO;,\\ME'], pref: ['1']}}
        ]);
    });

    it('Should parse url in property correctly', function () {
        const raw = 'URL:http://akitov.info',
            card = vCard.parse(raw);

        expect(card.url).toEqual([
            {value: 'http://akitov.info'}
        ]);
    });

    it('Should not convert case of extended property names', function () {
        const raw = 'item1.X-ABLabel:super',
            card = vCard.parse(raw);

        expect(card['X-ABLabel']).toEqual([
            {value: 'super', namespace: 'item1'}
        ]);
    });

    it('Should not create empty meta keys', function () {
        const raw = 'PHOTO;X-ABCROP-RECTANGLE=ABClipRect_1&0&0&671&671&Nh68TCRv7GErj8P8mk8qCA==;',
            card = vCard.parse(raw);

        expect(card['photo']).toEqual([
            { value : '', meta : { 'x-abcrop-rectangle' : [ 'ABClipRect_1&0&0&671&671&Nh68TCRv7GErj8P8mk8qCA' ] } }
        ]);
    });

    it('Should properly parse multi line PHOTO properties', function () {
        const raw = 'PHOTO;X-ABCROP-RECTANGLE=ABClipRect_1&0&0&671&671&Nh68TCRv7GErj8P8mk8qCA==;\n' +
        ' ENCODING=b;TYPE=JPEG:/9j/4AAQSkZJRgABAQEASABIAAD/4QBARXhpZgAATU0AKgAAAAgAA',
            card = vCard.parse(raw);

        expect(card['photo']).toEqual([
            {
                value: '/9j/4AAQSkZJRgABAQEASABIAAD/4QBARXhpZgAATU0AKgAAAAgAA',
                meta: {
                    encoding: ['b'],
                    type: ['JPEG'],
                    'x-abcrop-rectangle': ['ABClipRect_1&0&0&671&671&Nh68TCRv7GErj8P8mk8qCA']
                }
            }
        ]);
    });

    it('Should parse props with semicolon-separated values', function () {
        const raw = 'ORG:ABC\, Inc.;North American Division;Marketing',
            card = vCard.parse(raw);

        expect(card['org']).toEqual([
            { value: ['ABC, Inc.', 'North American Division', 'Marketing'] }
        ]);
    });

    it('Should parse props with comma-separated values', function () {
        const raw = 'NICKNAME:Jim,Jimmie',
            card = vCard.parse(raw);

        expect(card['nickname']).toEqual([
            { value: ['Jim', 'Jimmie'] }
        ]);
    });

    it('Should parse vcard with empty first name', function () {
        const raw = 'FN:',
            card = vCard.parse(raw);

        expect(card.fn).toEqual([{value: ''}]);
    });
});
