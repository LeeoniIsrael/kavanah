import copy
import json
import pathlib
import re
import unittest

from readableTransliteration import MODEH_ANI, STYLE, apply_readable_transliteration, readable_transliteration

ROOT = pathlib.Path(__file__).resolve().parents[1]


class ReadableTransliterationTests(unittest.TestCase):
    def test_owner_example_and_source_variants(self):
        original = 'moh-deh ah-nee le-fah-ney-khah meh-lehkh khahy ve-kah-yahm sheh-heh-khehzah-re-tah bee neesh-mah-tee be-khehm-lah, rah-bah eh-moo-nah-teh-khah:'
        self.assertEqual(readable_transliteration(original), MODEH_ANI)
        self.assertEqual(readable_transliteration(original.upper()), MODEH_ANI)
        different = 'moh-deh ah-nee le-fah-ney-khah ah-doh-NAI eh-loh-hahy'
        self.assertEqual(readable_transliteration(different), 'Modeh ani lefanecha Adonai Elohai')
        self.assertTrue(readable_transliteration(original + ' ah-mehn:').endswith('Amen.'))

    def test_familiar_words_and_preserved_vowels(self):
        self.assertEqual(readable_transliteration('bah-rookh ah-tah ah-doh-NAI eh-loh-hey-noo meh-lehkh hah-oh-lahm'), "Baruch atah Adonai Eloheinu melech ha'olam")
        self.assertEqual(readable_transliteration('she-mah yees-rah-ehl ah-doh-NAI eh-loh-hey-noo ah-doh-NAI eh-khahd:'), 'Shema Yisrael Adonai Eloheinu Adonai echad.')
        self.assertEqual(readable_transliteration('be-khehm-lah ve-kah-yahm oo-vah-rah'), "B'chemla ve kayam uvara")
        self.assertEqual(readable_transliteration('le-dah-VEED ne-eh-RAH shah-ah'), "LeDavid ne'era sha'a")

    def test_entire_catalog_and_repeat_safety(self):
        entries = json.loads((ROOT / 'src/data/researchPrayers.json').read_text())
        self.assertGreater(len(entries), 500)
        for prayer in entries:
            self.assertEqual(prayer['research']['transliterationStyle'], STYLE)
            for token in prayer['tokens']:
                text = token['transliteration']
                if token.get('kind') == 'instruction':
                    self.assertEqual(text, '')
                else:
                    self.assertTrue(text.strip(), token['id'])
                    self.assertFalse(re.search(r'[A-Z]{2,}', text), token['id'])
                    self.assertFalse(re.search(r'\b[a-z]+-[a-z]+-[a-z]+\b', text), token['id'])
                    self.assertNotRegex(text, r'\b(?:kh|ts)[a-z]')
        before = copy.deepcopy(entries)
        apply_readable_transliteration(entries)
        self.assertEqual(entries, before)

    def test_only_transliteration_and_style_metadata_change(self):
        entries = [{'research': {'pronunciationStatus': 'machine-draft-unreviewed'}, 'tokens': [
            {'id': 'prayer-1', 'hebrew': 'בָּרוּךְ', 'translation': 'Blessed', 'transliteration': 'bah-rookh'},
            {'id': 'prayer-2', 'hebrew': 'יחיד אומר', 'translation': 'An individual says', 'transliteration': '', 'kind': 'instruction'}]}]
        before = copy.deepcopy(entries)
        apply_readable_transliteration(entries)
        self.assertEqual(entries[0]['tokens'][0]['transliteration'], 'Baruch')
        del entries[0]['research']['transliterationStyle']
        for new, old in zip(entries[0]['tokens'], before[0]['tokens']):
            new['transliteration'] = old['transliteration']
        self.assertEqual(entries, before)


if __name__ == '__main__':
    unittest.main()
