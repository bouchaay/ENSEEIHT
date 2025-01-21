package buttons;
import java.awt.Color;
import java.awt.event.*;
import javax.swing.*;
import javax.swing.text.AttributeSet;
import javax.swing.text.BadLocationException;
import javax.swing.text.SimpleAttributeSet;
import javax.swing.text.StyleConstants;
import javax.swing.text.StyleContext;
import construction.*;
import panels.ColorConverter;

/** Classe action pour les boutons de type nouvelle ligne.
 * prend en paramètre un block et un champ de texte.
 */
public class ButtonNewLine extends ButtonClickAbstract implements ActionListener {

    /** Block associé au bouton. */
    private BlockNewLine block;

    /** Constructeur.
     * 
     * @param block Block associé au bouton
     * @param textField Champ de texte associé au bouton
     */
    public ButtonNewLine(BlockNewLine block, JTextPane textField) {
        super(block.getId(), block.getName(), block.toRegexFragment(), block.getColor(), true, textField);
        this.block = block;
    }

    /** Retourne le block associé au bouton.
     * 
     * @return Block associé au bouton
     */
    public BlockNewLine getBlock() {
        return block;
    }

    /** Modifie le block associé au bouton.
     * 
     * @param block Nouveau block associé au bouton
     */
    public void setBlock(BlockNewLine block) {
        this.block = block;
    }

    /** Action du bouton.
     * 
     * @param e ActionEvent
     */
    @Override
    public void actionPerformed(ActionEvent e) {
    	try {
            String regexFragment = this.getBlock().toRegexFragment();
            ColorConverter colorConverter = new ColorConverter(this.getBlock().getColor());
            Color colorBlock = colorConverter.convertirColor();
            StyleContext styleContext = StyleContext.getDefaultStyleContext();
            AttributeSet attributes = styleContext.addAttribute(SimpleAttributeSet.EMPTY, StyleConstants.Foreground, colorBlock);
            int offset = getTextPane().getCaretPosition();
            getTextPane().getStyledDocument().insertString(offset, regexFragment, attributes);
		} catch (BadLocationException e1) {
			e1.printStackTrace();
		}
    }

    /** Retourne le block associé au bouton.
     * 
     * @return Block associé au bouton
     */
    public static BlockNewLine returnButtonType () {
        return new BlockNewLine("Id-11", false);
    }
}
