import re
import xml.etree.ElementTree as ET
import logging
from typing import Optional, Dict, List, Tuple

logger = logging.getLogger('panoptes.hefesto.inspector')

class UIInspector:
    """
    Analiza dumps de UIAutomator (XML) para encontrar coordenadas de elementos.
    Es el 'ojo' de Hefesto que le dice dónde hacer click.
    """

    def __init__(self, xml_path: str):
        self.tree = ET.parse(xml_path)
        self.root = self.tree.getroot()

    def find_node_by_text(self, text: str, partial: bool = True, is_regex: bool = False) -> Optional[Dict]:
        """Busca el primer nodo que contenga el texto especificado."""
        pattern = None
        if is_regex:
            pattern = re.compile(text, re.IGNORECASE)

        for node in self.root.iter('node'):
            node_text = node.attrib.get('text', '')
            if not node_text:
                node_text = node.attrib.get('content-desc', '') # A veces el texto está en content-desc
            
            if not node_text:
                continue

            if is_regex:
                match = bool(pattern.search(node_text))
            else:
                match = (text.lower() in node_text.lower()) if partial else (text.lower() == node_text.lower())
            
            if match:
                return self._parse_node(node)
        return None

    def find_node_by_id(self, resource_id: str) -> Optional[Dict]:
        """Busca un nodo por su resource-id android."""
        for node in self.root.iter('node'):
            if resource_id in node.attrib.get('resource-id', ''):
                return self._parse_node(node)
        return None

    def find_all_nodes_by_regex(self, pattern_str: str) -> List[Dict]:
        """Busca TODOS los nodos que cumplan con el regex."""
        pattern = re.compile(pattern_str, re.IGNORECASE)
        results = []
        for node in self.root.iter('node'):
            node_text = node.attrib.get('text', '') or node.attrib.get('content-desc', '')
            if not node_text: continue
            
            if pattern.search(node_text):
                results.append(self._parse_node(node))
        return results

    def _parse_node(self, node) -> Dict:
        """Extrae coordenadas y texto de un nodo XML raw."""
        bounds = node.attrib.get('bounds') # Formato: [x1,y1][x2,y2]
        coord = self._parse_bounds(bounds)
        return {
            'text': node.attrib.get('text'),
            'content_desc': node.attrib.get('content-desc'),
            'id': node.attrib.get('resource-id'),
            'bounds': bounds,
            'center_x': coord[0],
            'center_y': coord[1]
        }

    def _parse_bounds(self, bounds_str: str) -> Tuple[int, int]:
        """[0,0][1080,2400] -> (540, 1200)"""
        try:
            parts = bounds_str.replace('][', ',').replace('[', '').replace(']', '').split(',')
            x1, y1, x2, y2 = map(int, parts)
            center_x = (x1 + x2) // 2
            center_y = (y1 + y2) // 2
            return (center_x, center_y)
        except:
            return (0, 0)
