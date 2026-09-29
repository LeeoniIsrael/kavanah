"""Publish captured pronunciation drafts in Kavanah's connected-word style.

This changes spelling/presentation, not the source reading or review status.
Input is the research engine's syllabified draft, never Hebrew or English.
Keep the research snapshot intact so imports remain reproducible.
"""
import re

STYLE = 'connected-words-v1'
MODEH_ANI = "Modeh Ani Lefanecha,\nmelech chai ve kayam,\nshehech-zarta bee, nishmati, b'chemla,\nRabah Emunatecha"

# Familiar spellings and a few targeted reading aids. Keys are the captured
# engine's spelling without stress capitals. Do not infer these from titles:
# passages with different words must retain their own source reading.
WORDS = {
    'moh-deh': 'modeh', 'moh-dah': 'modah', 'te-fee-leen': 'tefillin',
    'le-fah-ney-khah': 'lefanecha', 'eh-moo-nah-teh-khah': 'emunatecha',
    'sheh-heh-khehzah-re-tah': 'shehech-zarta',
    'bee': 'bee', 'be-khehm-lah': "b'chemla", 'rah-bah': 'rabah',
    'ah-tah': 'atah', 'ah-tahh': 'atah', 'ah-t': 'at',
    'toh-rah': 'torah', 'te-fee-lah': 'tefilah',
    'mee-ts-vah': 'mitzvah', 'meets-vah': 'mitzvah',
    'she-khee-nah': 'shechina', 'ye-hoo-dah': 'Yehudah',
    'ah-doh-nai': 'Adonai', 'eh-loh-heem': 'Elohim',
    'eh-loh-hey-noo': 'Eloheinu', 'eh-loh-hey-khah': 'Elohecha',
    'eh-loh-hey-khehm': 'Elohechem', 'eh-loh-hahy': 'Elohai',
    'eh-loh-hey': 'Elohei', 'yees-rah-ehl': 'Yisrael',
    'ye-roo-shah-lah-yeem': 'Yerushalayim',
    'ahv-rah-hahm': 'Avraham', 'yeets-khahk': 'Yitzchak',
    'yah-ah-kohv': 'Yaakov', 'moh-sheh': 'Moshe', 'm-sheh': 'Moshe', 'dah-veed': 'David',
    'kee-de-shah-noo': 'kidshanu',
    'neh-eh-mahn': "ne'eman", 'nah-ah-seh': "na'aseh",
    'le-mah-ahn': "lema'an", 'be-eh-meht': "b'emet",
    'mah-ah-seh': "ma'aseh", 'mah-ah-sey': "ma'asei",
    've-ah-hahv-tah': "ve'ahavta", 've-eem-roo': "ve'imru",
    'sheh-eem': "she'im", 'ee': 'ee',
    'le-oh-lahm': "le'olam", 'hah-oh-lahm': "ha'olam",
}


def readable_word(draft):
    word = draft.lower()
    if word in WORDS:
        return WORDS[word]
    # Separate a vocal ve- as in the owner's “ve kayam”; retain va-/u-,
    # which have different vowels. Keep short b'/k' prefixes unobtrusive.
    for prefix, spelling in [('ve-', 've '), ('be-', "b'"), ('ke-', "k'")]:
        if word.startswith(prefix):
            return spelling + readable_word(word[len(prefix):])
    # Preserve familiar Divine Names even when a preposition is attached.
    for prefix, spelling in [('le-', 'le'), ('lah-', 'la'), ('meh-', 'me'), ('oo-', 'u')]:
        if word.startswith(prefix) and word[len(prefix):] in WORDS:
            return spelling + WORDS[word[len(prefix):]]
    # Replace phonetic vowel digraphs *inside each syllable*. Removing all
    # separators first would mistake a consonant h in the next syllable for
    # part of the preceding vowel (e.g. Eloheinu).
    syllables = []
    for syllable in word.split('-'):
        syllable = syllable.replace('kh', 'ch').replace('ts', 'tz')
        syllable = re.sub(r'ah|eh|oh|ee|oo|ey', lambda m: {
            'ah': 'a', 'eh': 'e', 'oh': 'o', 'ee': 'i', 'oo': 'u', 'ey': 'ei'
        }[m[0]], syllable)
        syllables.append(syllable)
    result = ''.join(syllables)
    result = re.sub(r'([aeiou])\1', r"\1'\1", result)
    result = re.sub(r'ay$', 'ai', result)
    # Final -eh is familiar in words such as oseh, boreh and hineh.
    if result.endswith('e'):
        result += 'h'
    return result


def readable_transliteration(draft):
    """Convert one original draft, preserving word order and source clauses."""
    if not draft.strip():
        return ''
    text = re.sub(r'[\u200c-\u200f]', '', draft)
    text = re.sub(r'[A-Za-z]+(?:-[A-Za-z]+)*', lambda m: readable_word(m[0]), text)
    # Only the exact complete source phrase receives the owner's lineation.
    # Other Modeh Ani passages (including different editions) stay intact.
    modeh = "modeh ani lefanecha melech chai ve kayam shehech-zarta bee nishmati b'chemla, rabah emunatecha:"
    if text.strip().lower() == modeh:
        return MODEH_ANI
    # Source clause endings become natural reading pauses. Never manufacture
    # commas by counting words or alter the Hebrew/translation token boundary.
    text = re.sub(r':', '.', text)
    text = re.sub(r'([,.;!?])\s+', r'\1\n', text.strip())
    text = re.sub(r'(^|[.!?]\s+)([a-z])', lambda m: m[1] + m[2].upper(), text)
    return text


def apply_readable_transliteration(entries):
    for prayer in entries:
        # Guard against transforming already-published spellings a second time.
        if prayer.get('research', {}).get('transliterationStyle') == STYLE:
            continue
        for token in prayer['tokens']:
            token['transliteration'] = '' if token.get('kind') == 'instruction' else readable_transliteration(token['transliteration'])
        prayer['research']['transliterationStyle'] = STYLE
