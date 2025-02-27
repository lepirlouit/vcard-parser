import * as vCard from '../lib/vcard';

describe('vCard.generate', function () {
    const PREFIX = 'BEGIN:VCARD',
        POSTFIX = 'END:VCARD';

    it('Should generate vcard with simple property', function () {
        const card = {
            fn: [{value: 'Forest Gump'}]
        };
        const string = vCard.generate(card);

        expect(string).toEqual([
            PREFIX,
            'FN:Forest Gump',
            POSTFIX
        ].join('\r\n'));
    });

    it('Should generate vcard with complex property', function () {
        const card = {
            n: [{
                value: [
                    'Gump', 'Forrest', '', 'Mr.', ''
                ]
            }]
        };
        const string = vCard.generate(card);

        expect(string).toEqual([
            PREFIX,
            'N:Gump;Forrest;;Mr.;',
            POSTFIX
        ].join('\r\n'));
    });


    it('Should generate vcard with repeated properties', function () {
        const card = {
            fn: [
                {value: 'Forrest Gump'},
                {value: 'Other Gump'}
            ]
        };
        const string = vCard.generate(card);

        expect(string).toEqual([
            PREFIX,
            'FN:Forrest Gump',
            'FN:Other Gump',
            POSTFIX
        ].join('\r\n'));
    });

    it('Should generate vcard with metadata', function () {
        const card = {
            tel: [
                {value: '78884545247', meta: {type: ['HOME']}}
            ]
        };
        const string = vCard.generate(card);

        expect(string).toEqual([
            PREFIX,
            'TEL;TYPE=HOME:78884545247',
            POSTFIX
        ].join('\r\n'))
    });

    it('Should generate vcard with multiple metadata', function () {
        const card = {
            tel: [
                {value: '78884545247', meta: {type: ['HOME'], pref: ['1']}}
            ]
        };
        const string = vCard.generate(card);

        expect(string).toEqual([
            PREFIX,
            'TEL;TYPE=HOME;PREF=1:78884545247',
            POSTFIX
        ].join('\r\n'));
    });

    it('Should not break comma seperated type keys', function () {
        const card = {
            tel: [
                {value: '78884545247', meta: {type: ['HOME,PREF']}}
            ]
        };
        const string = vCard.generate(card);

        expect(string).toEqual([
            PREFIX,
            'TEL;TYPE=HOME,PREF:78884545247',
            POSTFIX
        ].join('\r\n'));
    });

    it('Should generate vcard with multiple values of one metadata field', function () {
        const card = {
            tel: [
                {value: '78884545247', meta: {type: ['HOME', 'CELL']}}
            ]
        };
        const string = vCard.generate(card);

        expect(string).toEqual([
            PREFIX,
            'TEL;TYPE=HOME;TYPE=CELL:78884545247',
            POSTFIX
        ].join('\r\n'));
    });

    it('Should generate vcard with namespace', function () {
        const card = {
            email: [
                {value: 'other@email.com', namespace: 'item1', meta: {type: ['INTERNET']}}
            ]
        };
        const string = vCard.generate(card);

        expect(string).toEqual([
            PREFIX,
            'item1.EMAIL;TYPE=INTERNET:other@email.com',
            POSTFIX
        ].join('\r\n'));
    });

    it('Should break long lines', function () {
        const card = {
            note: [
                {value: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. ' +
                'Doloremque dolores eum incidunt mollitia reiciendis sed sunt temporibus ' +
                'veniam veritatis voluptas.'}
            ]
        };
        const string = vCard.generate(card);

        expect(string).toEqual([
            PREFIX,
            'NOTE:Lorem ipsum dolor sit amet\\, consectetur adipisicing elit. Doloremque ',
            ' dolores eum incidunt mollitia reiciendis sed sunt temporibus veniam verita',
            ' tis voluptas.',
            POSTFIX
        ].join('\r\n'))
    });

    it('Should add version and uid field', function () {
        const string = vCard.generate({}, true),
            arr = string.split('\r\n');

        expect(arr[0]).toEqual(PREFIX);
        expect(arr[1]).toEqual('VERSION:3.0');
        expect(arr[2].indexOf('UID:')).toEqual(0);
        expect(arr[3]).toEqual(POSTFIX);
    });

    it('Should ignore undefined properties', function () {
        const card = {
            fn: undefined
        };
        const string = vCard.generate(card as unknown as vCard.vCard);

        expect(string).toEqual([
            PREFIX,
            POSTFIX
        ].join('\r\n'));
    });

    it('Should ignore properties with undefined values', function () {
        const card = {
            fn: [
                {value: undefined}
            ]
        };
        const string = vCard.generate(card as unknown as vCard.vCard);

        expect(string).toEqual([
            PREFIX,
            POSTFIX
        ].join('\r\n'));
    });

    it('Should ignore non-required properties with empty string values', function () {
        const card = {
            url: [
                {value: ''}
            ]
        };
        const string = vCard.generate(card);

        expect(string).toEqual([
            PREFIX,
            POSTFIX
        ].join('\r\n'));
    });

    it('Should NOT ignore FN with empty string value', function () {
        const card = {
            fn: [
                { value: '' }
            ]
        };
        const string = vCard.generate(card);

        expect(string).toEqual([
            PREFIX,
            'FN:',
            POSTFIX
        ].join('\r\n'));
    });

    it('Should NOT ignore properties with array of empty values', function () {
        const card = {
            adr: [
                {value: ['','','','','','','']}
            ]
        };
        const string = vCard.generate(card);

        expect(string).toEqual([
            PREFIX,
            'ADR:;;;;;;',
            POSTFIX
        ].join('\r\n'));
    });

    it('Should ignore properties with array of undefined values', function () {
        const card = {
            adr: [
                {value: [undefined,undefined,undefined,undefined,undefined,undefined,undefined]}
            ]
        };
        const string = vCard.generate(card as unknown as vCard.vCard);

        expect(string).toEqual([
            PREFIX,
            POSTFIX
        ].join('\r\n'));
    });

    it('Should ignore wrong formatted properties', function () {
        const card = {
            fn: {value: 'Wrong formatted'}
        };
        const string = vCard.generate(card as unknown as vCard.vCard);

        expect(string).toEqual([
            PREFIX,
            POSTFIX
        ].join('\r\n'));
    });

    it('Should ignore wrong formatted meta properties', function () {
        const card = {
            tel: [
                {value: '78884545247', meta: 'string are not allowed here'}
            ],
            email: [
                {value: 'admin@example.com', meta: {type: 'string'}}
            ]
        };
        const string = vCard.generate(card as unknown as vCard.vCard);

        expect(string).toEqual([
            PREFIX,
            'TEL:78884545247',
            'EMAIL:admin@example.com',
            POSTFIX
        ].join('\r\n'));
    });
    it('Should remove line breaks', function () {
        const card = {
            adr: [
                {value: ['sdfsdfsffsfsdsdfsfdfsdf\nfsdfdsfsdfqewe\nsdfsdf','','','',''], meta: {type: ['WORK']}}
            ]
        };
        const string = vCard.generate(card);
        expect(string).toEqual([
            PREFIX,
            'ADR;TYPE=WORK:sdfsdfsffsfsdsdfsfdfsdf\\nfsdfdsfsdfqewe\\nsdfsdf;;;;',
            POSTFIX
        ].join('\r\n'));
    });

    it('Should escape semicolon, colon and backslash in values', function () {
        const card = {
            tel: [
                {value: '1;,2,;\\3;'}
            ],
            adr: [
                {value: ['1;,2,;3;','','','','']}
            ]
        };
        const string = vCard.generate(card);

        expect(string).toEqual([
            PREFIX,
            'TEL:1\\;\\,2\\,\\;\\3\\;',
            'ADR:1\\;\\,2\\,\\;3\\;;;;;',
            POSTFIX
        ].join('\r\n'));
    });

    it('Should escape semicolon and backslash in meta fields', function () {
        const card = {
            tel: [
                {value: '78884545247', meta: {type: ['HO;,\\ME'], pref: ['1']}}
            ]
        };
        const string = vCard.generate(card);

        expect(string).toEqual([
            PREFIX,
            'TEL;TYPE=HO\\;,\\ME;PREF=1:78884545247',
            POSTFIX
        ].join('\r\n'));
    });

    it('Should not convert case on extended property names', function () {
        const card = {
            'X-ABLabel': [
                {value: 'super', namespace: 'item1'}
            ]
        };
        const string = vCard.generate(card);

        expect(string).toEqual([
            PREFIX,
            'item1.X-ABLabel:super',
            POSTFIX
        ].join('\r\n'));
    });

    it('Should not fail on undefined values', function () {
        const card = {
            tel: [
                {value: '78884545247', meta: {'': [undefined], type: ['HO;,\\ME'], pref: ['1'] }}
            ]
        };
        const string = vCard.generate(card);

        expect(string).toEqual([
            PREFIX,
            'TEL;TYPE=HO\\;,\\ME;PREF=1:78884545247',
            POSTFIX
        ].join('\r\n'));
    });

    it('Should not change my data', function () {
        const card = {
            adr: [
                {value: ['A', '1,2', 'b']  }
            ],
            nickname: [
                {value: 'Mouse,Mikey'  }
            ]
        };
        const string = vCard.generate(card);

        expect(string).toEqual([
            PREFIX,
            'ADR:A;1\\,2;b',
            'NICKNAME:Mouse\\,Mikey',
            POSTFIX
        ].join('\r\n'));
        expect(card).toEqual({
            adr:[
                {value: ['A', '1,2', 'b']}
            ],
            nickname: [
                {value: 'Mouse,Mikey'  }
            ]
        });
    });

    it('Should use comma separator for NICKNAME,RELATED, CATEGORIES and PID fields', function () {
        const card = {
            nickname: [
                { value: ['Jim', 'Jimmie'] }
            ],
            categories: [
                { value: ['INTERNET', 'INFORMATION TECHNOLOGY'] }
            ]
        };
        const string = vCard.generate(card);

        expect(string).toEqual([
            PREFIX,
            'NICKNAME:Jim,Jimmie',
            'CATEGORIES:INTERNET,INFORMATION TECHNOLOGY',
            POSTFIX
        ].join('\r\n'));
    });
});
