"""Explicit, source-addressed practice sequences; never reconstruct sacred text."""
import gzip, json

def add_practice_guides(data, entries, make, editions, clean):
    ref = 'Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Tefillin'
    rows = [json.loads(line) for line in gzip.open(data/'liturgy-corpus.jsonl.gz', 'rt')]
    source = next(r for r in rows if r['ref'] == ref)
    shema = next(p for p in entries if p['id'] == 'shema')
    tokens = []
    def add(address, title, body, custom=None):
        h = next(s for s in source['hebrew']['segments'] if s['address'] == [address])
        e = next(s for s in source['english']['segments'] if s['address'] == [address])
        tr = h['transliterationDraft']['text']
        assert h['text'] and e['text'] and tr
        t = dict(id=f'tefillin-{address}', hebrew=h['text'], translation=e['text'], transliteration=clean(tr), sourceRef=f'{ref} {address}', readingStep=dict(title=title, body=body))
        if custom: t['custom'] = custom
        tokens.append(t)
    add(3, 'First · Place the arm tefillin', 'If you wear a tallit, put it on first. Place the arm box directly on the lower half of the upper-arm muscle, turned inward toward your heart. Right-handed people usually use the left arm; left-handed people usually use the right. For mixed handedness, ask which arm to use. Say the blessing below before tightening the strap.')
    add(5, 'Next · Place the head tefillin', 'After the arm blessing, secure the arm box and wind seven turns around the forearm according to your custom, black side outward. Avoid unrelated speech until both boxes are secured. Place the head box centrally above the original hairline, never on the forehead; the knot sits at the back of the head. Many Ashkenazi communities say this second blessing before securing the head tefillin. Sephardi, Chabad and some Ashkenazi customs omit it when there was no interruption.', 'two-blessings')
    add(7, 'Then · After the second blessing', 'If your custom uses the second blessing, secure the head tefillin, then say Baruch shem quietly. If your custom uses only one blessing, skip this response here.', 'two-blessings')
    add(8, 'A customary request · Umechochmatecha', 'This request appears in the Ashkenazi source after the head tefillin. Say it if it is your custom; it is not another blessing. Other communities omit it.')
    add(10, 'Now · Finish wrapping the hand', 'With the head tefillin secured, wind the strap three times around the middle finger and finish around the hand according to the pattern you were taught. The direction, finger order and hand shape differ by community. Many say Ve’erastich while wrapping; Chabad generally omits these verses. The source demonstration below shows the Chabad wrapping pattern, not every custom.')
    add(12, 'While wearing tefillin · Kadesh', 'Many communities read these two Exodus passages while wearing tefillin. This guide places them before Shema, following the captured Ashkenazi order. Their place in the full service differs by custom. Begin with Exodus 13:1–10 below.')
    add(13, 'Continue · Vehayah ki yevi’acha', 'Read Exodus 13:11–16. Then continue to Shema; this is not the end of the reading.')
    steps = {
        2: ('Before Shema · If your custom says it', 'When praying alone, many Ashkenazi communities begin with El melech ne’eman. Omit these words with a minyan and in customs that use the final repetition instead, including Chabad. The blessing choice above does not select your Shema custom.'),
        3: ('Now say · Shema Yisrael', 'This is the opening of Shema, not the whole prayer. Cover your eyes with your right hand for this first verse. If you are following Shacharit, say Shema in its place after its opening blessings; do not use this guide to replace the service.'),
        5: ('Quietly · Baruch shem', 'Pause briefly after the opening verse, then say this response quietly.'),
        6: ('Continue · Ve’ahavta', 'Uncover your eyes and read the rest of the first paragraph. Continue through all the words below.'),
        7: ('Then · Vehayah im shamoa', 'Read the second paragraph of Shema in full.'),
        8: ('Then · Vayomer', 'Read the third paragraph of Shema, including the remembrance of the Exodus. Follow your custom at the ending: Chabad practice when alone repeats the final words Ani Adonai Eloheichem before saying Emet. Other customs use their own repetition or listen to the leader. Join the ending to Emet below without unrelated speech.'),
        10: ('Finish this reading · Emet', 'Say this word joined to the end of the previous paragraph. In a congregation, follow the leader’s repetition according to your custom. During Shacharit, continue directly into the blessing after Shema in your siddur.'),
    }
    for n, (title, body) in steps.items():
        t = next(t for t in shema['tokens'] if t['id'] == f'shema-{n}')
        tokens.append({**t, 'id': f'tefillin-shema-{n}', 'sourceRef': f"{shema['sefariaRef']} {n}", 'readingStep': dict(title=title, body=body)})
    p = make('tefillin', ref, 'Tefillin', ['tefillin'], 'Practice guides', [], 'varies', 'תפילין', editions[source['hebrew']['editionId']], editions[source['english']['editionId']], tokens, 'remote-unreviewed', 'Put on tefillin, follow your custom, and read the accompanying passages, including all three paragraphs of Shema.', 'practice-tefillin')
    p['aliases'] += ['tefilin', 'tfilin', 'tefillin prayer', 'lay tefillin', 'put on tefillin', 'wrapping tefillin', 'phylacteries']
    p['useCase'] = 'A weekday tefillin guide: preparation, blessings, wrapping, Kadesh, Vehayah ki yevi’acha, Shema with Ve’ahavta, and removal. A practice sequence, not the complete Shacharit service.'
    p['hebrewReview']['sourceTitle'] = 'Siddur Ashkenaz · Tefillin and Shema'
    p['hebrewReview']['notes'] = 'Selected, source-addressed passages assembled into a practice guide. The unaligned Leshem yichud introduction is not included. Customary passages are labeled. Hebrew, translation and pronunciation retain the captured Metsudah edition and await expert review.'
    p['practice'] = 'tefillin'
    shema['aliases'] += ['veahavta', 'vehafta', 'v’ahavta', 've ahavta', 'vehaya im shamoa', 'vayomer', 'full shema']
    shema['summary'] = 'Shema Yisrael, Baruch shem, Ve’ahavta, Vehayah im shamoa and Vayomer, with the source’s congregational directions.'
    shema['useCase'] = 'Read all three paragraphs of Shema. Used morning and evening; the surrounding blessings belong to the appropriate service. For putting on tefillin, open Tefillin. For sleep, open Bedtime Shema.'
    for p in entries:
        if p['id'] == 'sefaria-siddur-ashkenaz-weekday-maariv-keri-at-shema-al-hamita':
            p['title'] = 'Bedtime Shema'
            p['aliases'] += ['bedtime', 'sleep', 'shema before bed', 'hamapil', 'keriat shema al hamita']
            p['summary'] = 'The bedtime sequence, including forgiveness, Hamapil, Shema and the accompanying verses in this Ashkenazi edition.'
        if p['title'] == 'Bedtime Shema':
            p['useCase'] = 'Say when ready to sleep. Includes Hamapil and the passages printed in this edition; the order and added verses differ by custom. This does not replace Maariv.'
